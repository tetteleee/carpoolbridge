import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { EventHeaderTitle } from '../components/EventHeaderTitle';
import { Button } from '../components/common/Button';
import { FamilyResponseCard } from '../components/eventEdit/FamilyResponseCard';
import { CarpoolRecreateDialog } from '../components/eventEdit/CarpoolRecreateDialog';
import { DevSampleResponseButton } from '../components/eventEdit/DevSampleResponseButton';
import { CarIcon, ChevronDownIcon, LoadingIndicator } from '../components/icons';
import { getEvent } from '../services/event/eventService';
import { getDestination } from '../services/master/destinationService';
import { getFamilies } from '../services/master/familyService';
import { getPlayersByFamilyId } from '../services/master/playerService';
import { getFamilyMembersByFamilyId } from '../services/master/familyMemberService';
import { getPickupLocations } from '../services/master/pickupLocationService';
import { getResponses } from '../services/event/responseService';
import { getCarpools, deleteAllCarpools } from '../services/event/carpoolService';
import { runCarpoolAssignment } from '../services/carpool/runCarpoolAssignment';
import { formatDateWithWeekday } from '../utils/date';
import { getFamilyHighestGrade } from '../utils/schoolGrade';
import { computeResponseStatus, type ResponseStatus } from '../utils/responseStatus';
import type { Event, Response } from '../types/event';
import type { Player, Family, FamilyMember, PickupLocation } from '../types/master';

/**
 * 対象イベントの行き・帰り両方向の配車を作成する。
 * 一方でもHard Failエラーが発生した場合は、その時点でエラーを返す
 * （04_画面設計.md#7には方向別の分岐は定義されておらず、
 * 「自動配車」ボタンは1つのため、両方向をまとめて作成する）。
 */
async function createCarpoolsForBothDirections(
  eventId: string
): Promise<{ success: true } | { success: false; message: string }> {
  for (const direction of ['OUTWARD', 'RETURN'] as const) {
    const result = await runCarpoolAssignment(eventId, direction);
    if (result.status === 'ERROR') {
      return { success: false, message: result.error.message };
    }
  }
  return { success: true };
}

interface StatusCountTierProps {
  /** 状態を示すドットの色 */
  dotColor: string;
  /** ドットの不透明度（未指定時は1） */
  dotOpacity?: number;
  label: string;
  count: number;
}

/** ヘッダー下の集計表示（色付きドット＋ラベル＋件数）の1項目分 */
function StatusCountTier({ dotColor, dotOpacity = 1, label, count }: StatusCountTierProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
      <span
        aria-hidden="true"
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: dotColor,
          opacity: dotOpacity,
          flexShrink: 0,
        }}
      />
      {label} <strong style={{ color: 'var(--text-h)' }}>{count}</strong>
    </span>
  );
}

/**
 * イベント編集（回答入力）画面。
 * 対象イベントに関わる有効な家庭を家庭単位のカードで一覧表示する。
 * 各入力項目（T25〜T28）は、変更の都度Firestoreへ自動保存される（T29）。
 */
export function EventEditPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [destinationName, setDestinationName] = useState('');
  const [families, setFamilies] = useState<Family[]>([]);
  const [playersByFamilyId, setPlayersByFamilyId] = useState<
    Record<string, Player[]>
  >({});
  const [familyMembersByFamilyId, setFamilyMembersByFamilyId] = useState<
    Record<string, FamilyMember[]>
  >({});
  const [pickupLocationList, setPickupLocationList] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responsesByFamilyId, setResponsesByFamilyId] = useState<
    Record<string, Response>
  >({});
  const [responseVersion, setResponseVersion] = useState(0);
  // 折りたたまれている家庭ID（家庭一覧の取得後に全家庭IDで初期化し、全折りたたみ状態から始める。
  // 04_画面設計.md#7「家庭カードの折りたたみ」参照）
  const [collapsedFamilyIds, setCollapsedFamilyIds] = useState<Set<string>>(new Set());
  // 家庭ごとの回答状況（回答済み／一部回答／未回答）。ヘッダー下の集計表示に使用する
  const [statusByFamilyId, setStatusByFamilyId] = useState<Record<string, ResponseStatus>>({});
  const [recreateDialogOpen, setRecreateDialogOpen] = useState(false);
  const [creatingCarpools, setCreatingCarpools] = useState(false);
  const [carpoolMessage, setCarpoolMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  useEffect(() => {
    if (!eventId) {
      return;
    }

    Promise.all([getEvent(eventId), getFamilies(), getResponses(eventId), getPickupLocations()])
      .then(async ([eventData, familiesData, responsesData, pickupLocationsData]) => {
        setEvent(eventData);
        setPickupLocationList(pickupLocationsData);

        const activeFamilies = familiesData.filter((family) => family.isActive);

        const [playersByFamily, familyMembersByFamily] = await Promise.all([
          Promise.all(activeFamilies.map((family) => getPlayersByFamilyId(family.id))),
          Promise.all(activeFamilies.map((family) => getFamilyMembersByFamilyId(family.id))),
        ]);
        const playersMap: Record<string, Player[]> = {};
        const familyMembersMap: Record<string, FamilyMember[]> = {};
        activeFamilies.forEach((family, index) => {
          playersMap[family.id] = playersByFamily[index].filter(
            (player) => player.isActive
          );
          familyMembersMap[family.id] = familyMembersByFamily[index].filter(
            (familyMember) => familyMember.isActive
          );
        });
        setPlayersByFamilyId(playersMap);
        setFamilyMembersByFamilyId(familyMembersMap);

        // 家庭カードの並び順：家庭内の選手の最高学年で降順、同学年は家庭名順（04_画面設計.md#7）
        const sortedFamilies = [...activeFamilies].sort((a, b) => {
          const gradeA = getFamilyHighestGrade(playersMap[a.id] ?? []);
          const gradeB = getFamilyHighestGrade(playersMap[b.id] ?? []);
          if (gradeA !== gradeB) {
            if (gradeA === null) return 1;
            if (gradeB === null) return -1;
            return gradeB - gradeA;
          }
          return a.familyName.localeCompare(b.familyName, 'ja');
        });
        setFamilies(sortedFamilies);
        // 初期状態は全家庭カードを折りたたんだ状態で表示する（04_画面設計.md#7参照）
        setCollapsedFamilyIds(new Set(sortedFamilies.map((family) => family.id)));

        const responseMap = Object.fromEntries(
          responsesData.map(({ familyId, ...response }) => [familyId, response])
        );
        setResponsesByFamilyId(responseMap);

        // 回答状況（回答済み／一部回答／未回答）の初期値。以降はFamilyResponseCard側からの通知で更新する
        const initialStatusMap: Record<string, ResponseStatus> = {};
        activeFamilies.forEach((family) => {
          const familyResponse: Response = responseMap[family.id] ?? {
            driverOutward: null,
            driverReturn: null,
            capacityToday: null,
            coachParticipating: null,
            coachNoOutwardRide: false,
            coachNoReturnRide: false,
            remarks: '',
            players: [],
            familyMembers: [],
            temporaryParticipants: [],
          };
          initialStatusMap[family.id] = computeResponseStatus(
            familyResponse,
            playersMap[family.id] ?? [],
            family.coachName !== null,
            familyMembersMap[family.id] ?? []
          );
        });
        setStatusByFamilyId(initialStatusMap);
      })
      .catch(() => setError('データの取得に失敗しました'))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    if (!event) {
      return;
    }
    getDestination(event.destinationId).then((destination) =>
      setDestinationName(destination?.name ?? '')
    );
  }, [event]);

  const runCreation = async (targetEventId: string) => {
    setCreatingCarpools(true);
    setCarpoolMessage(null);
    try {
      const result = await createCarpoolsForBothDirections(targetEventId);
      if (result.success) {
        navigate(`/events/${targetEventId}/carpool`);
      } else {
        setCarpoolMessage({ text: result.message, isError: true });
      }
    } catch {
      setCarpoolMessage({
        text: '配車の作成に失敗しました。もう一度お試しください。',
        isError: true,
      });
    } finally {
      setCreatingCarpools(false);
    }
  };

  const handleCreateCarpoolClick = async () => {
    if (!eventId) {
      return;
    }
    setCarpoolMessage(null);
    const existing = await getCarpools(eventId);
    if (existing.length === 0) {
      await runCreation(eventId);
    } else {
      setRecreateDialogOpen(true);
    }
  };

  const handleCancelRecreate = () => {
    setRecreateDialogOpen(false);
  };

  const handleConfirmRecreate = async () => {
    if (!eventId) {
      return;
    }
    setRecreateDialogOpen(false);
    setCarpoolMessage(null);
    setCreatingCarpools(true);
    try {
      await deleteAllCarpools(eventId);
    } catch {
      setCreatingCarpools(false);
      setCarpoolMessage({
        text: '既存の配車結果の削除に失敗しました。もう一度お試しください。',
        isError: true,
      });
      return;
    }
    await runCreation(eventId);
  };

  /**
   * サンプル回答生成（開発用機能）の完了後、最新の回答を再取得して画面に反映する。
   * FamilyResponseCardは初回描画時のpropsを内部状態の初期値として保持するため、
   * keyにresponseVersionを含めて再マウントさせることで最新の回答内容を反映させる。
   */
  const handleResponsesGenerated = async () => {
    if (!eventId) {
      return;
    }
    const responsesData = await getResponses(eventId);
    setResponsesByFamilyId(
      Object.fromEntries(
        responsesData.map(({ familyId, ...response }) => [familyId, response])
      )
    );
    setResponseVersion((v) => v + 1);
  };

  /**
   * 一時参加者を「マスタに登録」した際、対象家庭の家族一覧へ即座に反映する
   * （04_画面設計.md#7 一時参加者の追加）。
   */
  const handleFamilyMemberRegistered = (familyId: string, familyMember: FamilyMember) => {
    setFamilyMembersByFamilyId((prev) => ({
      ...prev,
      [familyId]: [...(prev[familyId] ?? []), familyMember],
    }));
  };

  /** 家庭カード1件のみ開閉する */
  const handleToggleFamilyOpen = (familyId: string) => {
    setCollapsedFamilyIds((prev) => {
      const next = new Set(prev);
      if (next.has(familyId)) {
        next.delete(familyId);
      } else {
        next.add(familyId);
      }
      return next;
    });
  };

  // 1つでも折りたたまれていれば「全て展開」、全展開済みなら「全て折りたたむ」を表示する
  const anyCollapsed = families.some((family) => collapsedFamilyIds.has(family.id));

  /** ヘッダー下の「全て展開／全て折りたたむ」ボタン */
  const handleToggleAllOpen = () => {
    setCollapsedFamilyIds(anyCollapsed ? new Set() : new Set(families.map((family) => family.id)));
  };

  const statusCounts = useMemo(() => {
    const counts: Record<ResponseStatus, number> = { answered: 0, partial: 0, unanswered: 0 };
    families.forEach((family) => {
      const status = statusByFamilyId[family.id] ?? 'unanswered';
      counts[status] += 1;
    });
    return counts;
  }, [families, statusByFamilyId]);

  return (
    <div
      id="event-edit-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--panel-bg)',
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          boxSizing: 'border-box',
        }}
      >
        <Header
          title={event ? event.name : '回答入力'}
          backTo={eventId ? `/events/${eventId}/carpool` : undefined}
          titleContent={
            event && (
              <EventHeaderTitle
                date={formatDateWithWeekday(event.date)}
                title={event.name}
                location={destinationName || undefined}
              />
            )
          }
          trailing={
            eventId &&
            !loading &&
            !error && (
              <Button
                variant="primary"
                size="sm"
                icon={<CarIcon size={16} />}
                onClick={handleCreateCarpoolClick}
                disabled={creatingCarpools}
              >
                {creatingCarpools ? '作成中' : '自動配車'}
              </Button>
            )
          }
        />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        {error && (
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--negative)' }}>
            {error}
          </p>
        )}

        {carpoolMessage && (
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: carpoolMessage.isError ? 'var(--negative)' : 'var(--text)',
              textAlign: 'center',
            }}
          >
            {carpoolMessage.text}
          </p>
        )}

        {!eventId ? (
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text)' }}>
            イベントIDが指定されていません
          </p>
        ) : loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <LoadingIndicator />
          </div>
        ) : !error && families.length === 0 ? (
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text)' }}>
            対象の家庭がありません
          </p>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '6px 8px',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 8px', fontSize: '12px', color: 'var(--text)' }}>
                <StatusCountTier dotColor="var(--positive)" label="回答済み" count={statusCounts.answered} />
                <StatusCountTier dotColor="var(--warning)" label="一部回答" count={statusCounts.partial} />
                <StatusCountTier dotColor="var(--text)" dotOpacity={0.45} label="未回答" count={statusCounts.unanswered} />
              </div>
              <button
                type="button"
                onClick={handleToggleAllOpen}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0,
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--accent)',
                  borderRadius: '999px',
                  padding: '5px 10px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  fontFamily: 'var(--sans)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ display: 'flex', transform: anyCollapsed ? undefined : 'rotate(180deg)' }}
                >
                  <ChevronDownIcon size={13} />
                </span>
                {anyCollapsed ? '全て展開' : '全て折りたたむ'}
              </button>
            </div>

            {families.map((family) => (
              <FamilyResponseCard
                key={`${family.id}-${responseVersion}`}
                eventId={eventId}
                family={family}
                playerList={playersByFamilyId[family.id] ?? []}
                familyMemberList={familyMembersByFamilyId[family.id] ?? []}
                pickupLocationList={pickupLocationList}
                response={responsesByFamilyId[family.id]}
                isOpen={!collapsedFamilyIds.has(family.id)}
                onToggleOpen={() => handleToggleFamilyOpen(family.id)}
                onStatusChange={(status) =>
                  setStatusByFamilyId((prev) =>
                    prev[family.id] === status ? prev : { ...prev, [family.id]: status }
                  )
                }
                onFamilyMemberRegistered={(familyMember) =>
                  handleFamilyMemberRegistered(family.id, familyMember)
                }
              />
            ))}
          </>
        )}

        {eventId && !loading && !error && (
          <DevSampleResponseButton
            eventId={eventId}
            onGenerated={handleResponsesGenerated}
          />
        )}
      </div>

      <CarpoolRecreateDialog
        open={recreateDialogOpen}
        processing={creatingCarpools}
        onCancel={handleCancelRecreate}
        onConfirm={handleConfirmRecreate}
      />
    </div>
  );
}
