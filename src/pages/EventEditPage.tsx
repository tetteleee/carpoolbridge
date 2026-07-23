import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FamilyResponseCard } from '../components/eventEdit/FamilyResponseCard';
import { CarpoolRecreateDialog } from '../components/eventEdit/CarpoolRecreateDialog';
import { DevSampleResponseButton } from '../components/eventEdit/DevSampleResponseButton';
import { CarIcon } from '../components/icons';
import { getEvent } from '../services/event/eventService';
import { getFamilies } from '../services/master/familyService';
import { getChildrenByFamilyId } from '../services/master/childService';
import { getResponses } from '../services/event/responseService';
import { getCarpools, deleteAllCarpools } from '../services/event/carpoolService';
import { runCarpoolAssignment } from '../services/carpool/runCarpoolAssignment';
import { formatDateWithWeekday } from '../utils/date';
import type { Event, Response } from '../types/event';
import type { Child, Family } from '../types/master';

/**
 * 対象イベントの行き・帰り両方向の配車を作成する。
 * 一方でもHard Failエラーが発生した場合は、その時点でエラーを返す
 * （04_画面設計.md#7には方向別の分岐は定義されておらず、
 * 「配車作成」ボタンは1つのため、両方向をまとめて作成する）。
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

/**
 * イベント編集（回答入力）画面。
 * 対象イベントに関わる有効な家庭を家庭単位のカードで一覧表示する。
 * 各入力項目（T25〜T28）は、変更の都度Firestoreへ自動保存される（T29）。
 */
export function EventEditPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [childrenByFamilyId, setChildrenByFamilyId] = useState<
    Record<string, Child[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responsesByFamilyId, setResponsesByFamilyId] = useState<
    Record<string, Response>
  >({});
  const [responseVersion, setResponseVersion] = useState(0);
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

    Promise.all([getEvent(eventId), getFamilies(), getResponses(eventId)])
      .then(async ([eventData, familiesData, responsesData]) => {
        setEvent(eventData);

        const activeFamilies = familiesData.filter((family) => family.isActive);
        setFamilies(activeFamilies);

        const childrenByFamily = await Promise.all(
          activeFamilies.map((family) => getChildrenByFamilyId(family.id))
        );
        const childrenMap: Record<string, Child[]> = {};
        activeFamilies.forEach((family, index) => {
          childrenMap[family.id] = childrenByFamily[index].filter(
            (child) => child.isActive
          );
        });
        setChildrenByFamilyId(childrenMap);

        setResponsesByFamilyId(
          Object.fromEntries(
            responsesData.map(({ familyId, ...response }) => [familyId, response])
          )
        );
      })
      .catch(() => setError('データの取得に失敗しました'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const runCreation = async (targetEventId: string) => {
    setCreatingCarpools(true);
    setCarpoolMessage(null);
    const result = await createCarpoolsForBothDirections(targetEventId);
    setCreatingCarpools(false);
    if (result.success) {
      // 配車画面（メイン）への遷移はT39aで接続する（配車画面自体が未実装のため）
      setCarpoolMessage({ text: '配車を作成しました', isError: false });
    } else {
      setCarpoolMessage({ text: result.message, isError: true });
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
    setCreatingCarpools(true);
    setCarpoolMessage(null);
    await deleteAllCarpools(eventId);
    setRecreateDialogOpen(false);
    await runCreation(eventId);
  };

  // 配車画面（メイン）への遷移先接続はT39aで行う
  const handleBackClick = () => {};

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
          background: 'var(--bg)',
          padding: '16px',
          borderBottom: '1px solid var(--border)',
          boxSizing: 'border-box',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text-h)',
          }}
        >
          {event ? `${formatDateWithWeekday(event.date)} ${event.name}` : '回答入力'}
        </h1>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        {error && (
          <p style={{ margin: 0, fontSize: '13px', color: 'crimson' }}>
            {error}
          </p>
        )}

        {!eventId ? (
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text)' }}>
            イベントIDが指定されていません
          </p>
        ) : loading ? (
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text)' }}>
            読み込み中...
          </p>
        ) : !error && families.length === 0 ? (
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text)' }}>
            対象の家庭がありません
          </p>
        ) : (
          families.map((family) => (
            <FamilyResponseCard
              key={`${family.id}-${responseVersion}`}
              eventId={eventId}
              family={family}
              childList={childrenByFamilyId[family.id] ?? []}
              response={responsesByFamilyId[family.id]}
            />
          ))
        )}

        {eventId && !loading && !error && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              paddingTop: '8px',
            }}
          >
            {carpoolMessage && (
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  color: carpoolMessage.isError ? 'crimson' : 'var(--text)',
                }}
              >
                {carpoolMessage.text}
              </p>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                gap: '12px',
              }}
            >
              <button
                type="button"
                onClick={handleBackClick}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-h)',
                  fontSize: '15px',
                  fontWeight: 700,
                  fontFamily: 'var(--sans)',
                  cursor: 'pointer',
                }}
              >
                戻る
              </button>
              <button
                type="button"
                onClick={handleCreateCarpoolClick}
                disabled={creatingCarpools}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 700,
                  fontFamily: 'var(--sans)',
                  cursor: creatingCarpools ? 'default' : 'pointer',
                  opacity: creatingCarpools ? 0.6 : 1,
                }}
              >
                <CarIcon size={18} />
                {creatingCarpools ? '配車作成中...' : '配車作成'}
              </button>
            </div>
          </div>
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
