import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Timestamp } from 'firebase/firestore';
import type {
  Response,
  ResponseFamilyMember,
  ResponsePlayer,
  ResponseTemporaryParticipant,
} from '../../types/event';
import type { Player, Family, FamilyMember, PickupLocation } from '../../types/master';
import { getSchoolGrade } from '../../utils/schoolGrade';
import { computeResponseStatus, type ResponseStatus } from '../../utils/responseStatus';
import { createResponse, updateResponse } from '../../services/event/responseService';
import { createFamilyMember } from '../../services/master/familyMemberService';
import { HomeIcon, UserIcon, ChevronDownIcon, CloseIcon } from '../icons';
import { Card } from '../common/Card';
import { AddRow } from '../common/AddRow';
import { PlayerResponseRow } from './PlayerResponseRow';
import { CoachResponseRow } from './CoachResponseRow';
import { FamilyMemberResponseRow } from './FamilyMemberResponseRow';
import { AddTemporaryParticipantForm } from './AddTemporaryParticipantForm';
import { DriverAndCapacitySection } from './DriverAndCapacitySection';
import { RemarksSection } from './RemarksSection';
import { FamilyStatusChips } from './FamilyStatusChips';

interface FamilyResponseCardProps {
  /** 対象イベントID */
  eventId: string;
  /** 対象家庭 */
  family: Family;
  /** この家庭に属する有効な選手一覧 */
  playerList: Player[];
  /** この家庭に属する有効な家族一覧 */
  familyMemberList: FamilyMember[];
  /** 集合場所の選択肢一覧（一時参加者の追加フォームで使用） */
  pickupLocationList: PickupLocation[];
  /** 対象家庭の既存回答（未回答の場合はundefined） */
  response: Response | undefined;
  /** カードが展開表示かどうか（折りたたみ状態は呼び出し側で一括管理する） */
  isOpen: boolean;
  /** ヘッダー行タップ時に呼び出す開閉トグル */
  onToggleOpen: () => void;
  /** 回答状況（回答済み／一部回答／未回答）が変化した際に呼び出す（ヘッダー集計表示用） */
  onStatusChange: (status: ResponseStatus) => void;
  /**
   * 一時参加者を「マスタに登録」した際、新規作成したFamilyMemberを呼び出し側へ通知する。
   * 呼び出し側（EventEditPage）でfamilyMemberListへ反映し、家族欄に即座に表示させるために使用する
   * （04_画面設計.md#7 一時参加者の追加）。
   */
  onFamilyMemberRegistered: (familyMember: FamilyMember) => void;
}

const dividerStyle: CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--border)',
  margin: '4px 0',
};

/** 家庭カードのヘッダー行（タップで開閉するボタン）。家庭名の右側にチップ、右端にシェブロンを配置する */
const headerButtonStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 16px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--sans)',
  textAlign: 'left',
};

const familyNameStyle: CSSProperties = {
  margin: 0,
  fontSize: '16px',
  fontWeight: 700,
  color: 'var(--text-h)',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  flexShrink: 0,
};

const bodyWrapperStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  padding: '0 16px 12px',
};

const memberNameStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-h)',
};

/** 選手・コーチ・家族1人ごとの回答をまとめる内側ボックスの共通スタイル */
const memberBoxBaseStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '10px 16px',
};

/** 選手カードの内側ボックス（役割色：背景＋枠線＋左帯） */
const playerMemberBoxStyle: CSSProperties = {
  ...memberBoxBaseStyle,
  background: 'var(--player-bg)',
  border: '1px solid var(--player-border)',
  borderLeft: '5px solid var(--player-accent)',
};

/** コーチカードの内側ボックス（役割色：背景＋枠線＋左帯） */
const coachMemberBoxStyle: CSSProperties = {
  ...memberBoxBaseStyle,
  background: 'var(--coach-bg)',
  border: '1px solid var(--coach-border)',
  borderLeft: '5px solid var(--coach-accent)',
};

/** 家族カードの内側ボックス（役割色：背景＋枠線＋左帯） */
const familyMemberBoxStyle: CSSProperties = {
  ...memberBoxBaseStyle,
  background: 'var(--parent-bg)',
  border: '1px solid var(--parent-border)',
  borderLeft: '5px solid var(--parent-accent)',
};

/**
 * 学年表示ラベルを返す（例：小6）。対象学年外の場合は空文字を返す。
 */
function formatGradeLabel(schoolEntryYear: number): string {
  const grade = getSchoolGrade(schoolEntryYear);
  return grade === null ? '' : `（小${grade}）`;
}

/** 選手個別回答の初期値（未回答） */
function buildInitialResponsePlayer(playerId: string): ResponsePlayer {
  return {
    playerId,
    isParticipating: null,
    noOutwardRide: false,
    noReturnRide: false,
  };
}

/** 家族個別回答の初期値（未回答）。選手（buildInitialResponsePlayer）と全く同じ構造 */
function buildInitialResponseFamilyMember(familyMemberId: string): ResponseFamilyMember {
  return {
    familyMemberId,
    isParticipating: null,
    noOutwardRide: false,
    noReturnRide: false,
  };
}

/** 家庭の回答の初期値（既存回答が存在する場合はそれを使用し、なければ未回答の初期値を組み立てる） */
function buildInitialResponse(
  playerList: Player[],
  familyMemberList: FamilyMember[],
  response: Response | undefined
): Response {
  if (response) {
    // 家族・一時参加者の機能追加前に作成された回答ドキュメントには、それぞれのフィールドが
    // 存在しない場合があるため、欠けている場合のみ空配列で補う
    const withFamilyMembers = response.familyMembers ? response : { ...response, familyMembers: [] };
    return withFamilyMembers.temporaryParticipants
      ? withFamilyMembers
      : { ...withFamilyMembers, temporaryParticipants: [] };
  }
  return {
    driverOutward: null,
    driverReturn: null,
    capacityToday: null,
    coachParticipating: null,
    coachNoOutwardRide: false,
    coachNoReturnRide: false,
    remarks: '',
    players: playerList.map((player) => buildInitialResponsePlayer(player.id)),
    familyMembers: familyMemberList.map((familyMember) =>
      buildInitialResponseFamilyMember(familyMember.id)
    ),
    temporaryParticipants: [],
  };
}

/**
 * イベント編集（回答入力）画面の家庭カード。
 * 家庭名・所属する選手の一覧（名前・学年）、車出し・乗車可能人数（T25）、
 * 選手ごとの回答（T26）・コーチ参加回答（T27）・備考（T28）の入力欄を表示する。
 * コーチ参加回答の枠は、家庭にコーチが紐づく場合（coachNameが設定されている場合）のみ表示する。
 * 回答内容は家庭単位でこのコンポーネントが状態を保持し、変更の都度Firestoreへ自動保存する（T29）。
 * 「保存」ボタンは設けない（対象設計書#7）。
 */
export function FamilyResponseCard({
  eventId,
  family,
  playerList,
  familyMemberList,
  pickupLocationList,
  response,
  isOpen,
  onToggleOpen,
  onStatusChange,
  onFamilyMemberRegistered,
}: FamilyResponseCardProps) {
  const hasCoach = family.coachName !== null;
  const [current, setCurrent] = useState<Response>(() =>
    buildInitialResponse(playerList, familyMemberList, response)
  );
  // 対象家庭のResponseドキュメントが既にFirestore上に存在するか（新規作成か更新かの判定に使用）
  const hasDocRef = useRef<boolean>(response !== undefined);
  // 一時参加者の追加フォームを展開中かどうか（04_画面設計.md#7 一時参加者の追加）
  const [isAddingTemporaryParticipant, setIsAddingTemporaryParticipant] = useState(false);

  // 回答状況（回答済み／一部回答／未回答）。変更の都度、呼び出し側（ヘッダー集計表示用）へ通知する
  const status = useMemo(
    () => computeResponseStatus(current, playerList, hasCoach, familyMemberList),
    [current, playerList, hasCoach, familyMemberList]
  );
  useEffect(() => {
    onStatusChange(status);
  }, [status, onStatusChange]);

  /**
   * 家庭単位のResponseドキュメントへ自動保存する。
   * ドキュメントが未作成の場合は現在の全項目で新規作成し、以降は変更分のみを更新する。
   */
  const persist = (next: Response, patch: Partial<Response>) => {
    if (!hasDocRef.current) {
      hasDocRef.current = true;
      void createResponse(eventId, family.id, next).catch((error) => {
        console.error('回答の自動保存（新規作成）に失敗しました', error);
      });
      return;
    }
    void updateResponse(eventId, family.id, patch).catch((error) => {
      console.error('回答の自動保存（更新）に失敗しました', error);
    });
  };

  /** 家庭情報（車出し・乗車可能人数・コーチ参加・備考）の変更を反映し、自動保存する */
  const applyPatch = (patch: Partial<Response>) => {
    const next = { ...current, ...patch };
    setCurrent(next);
    persist(next, patch);
  };

  /** 選手個別の回答（参加・行き／帰りの配車不要）の変更を反映し、自動保存する */
  const applyPlayerPatch = (playerId: string, patch: Partial<ResponsePlayer>) => {
    const exists = current.players.some((responsePlayer) => responsePlayer.playerId === playerId);
    const nextPlayers = exists
      ? current.players.map((responsePlayer) =>
          responsePlayer.playerId === playerId ? { ...responsePlayer, ...patch } : responsePlayer
        )
      : [...current.players, { ...buildInitialResponsePlayer(playerId), ...patch }];
    const next = { ...current, players: nextPlayers };
    setCurrent(next);
    persist(next, { players: nextPlayers });
  };

  /** 家族個別の回答（参加・行き／帰りの配車不要）の変更を反映し、自動保存する */
  const applyFamilyMemberPatch = (familyMemberId: string, patch: Partial<ResponseFamilyMember>) => {
    const exists = current.familyMembers.some((f) => f.familyMemberId === familyMemberId);
    const nextFamilyMembers = exists
      ? current.familyMembers.map((f) =>
          f.familyMemberId === familyMemberId ? { ...f, ...patch } : f
        )
      : [...current.familyMembers, { ...buildInitialResponseFamilyMember(familyMemberId), ...patch }];
    const next = { ...current, familyMembers: nextFamilyMembers };
    setCurrent(next);
    persist(next, { familyMembers: nextFamilyMembers });
  };

  /** 一時参加者個別の回答（参加・行き／帰りの配車不要）の変更を反映し、自動保存する */
  const applyTemporaryParticipantPatch = (
    temporaryParticipantId: string,
    patch: Partial<ResponseTemporaryParticipant>
  ) => {
    const nextTemporaryParticipants = current.temporaryParticipants.map((t) =>
      t.id === temporaryParticipantId ? { ...t, ...patch } : t
    );
    const next = { ...current, temporaryParticipants: nextTemporaryParticipants };
    setCurrent(next);
    persist(next, { temporaryParticipants: nextTemporaryParticipants });
  };

  /** 一時参加者を取り消す。マスタに存在しないため、確認ダイアログなしでその場から削除する（04_画面設計.md#7） */
  const handleRemoveTemporaryParticipant = (temporaryParticipantId: string) => {
    const nextTemporaryParticipants = current.temporaryParticipants.filter(
      (t) => t.id !== temporaryParticipantId
    );
    const next = { ...current, temporaryParticipants: nextTemporaryParticipants };
    setCurrent(next);
    persist(next, { temporaryParticipants: nextTemporaryParticipants });
  };

  /**
   * 今回だけ参加する人を追加する（04_画面設計.md#7 一時参加者の追加）。
   * 「今回限り」はこのResponseドキュメント内（temporaryParticipants）にのみ保持し、
   * 「マスタに登録」は通常のFamilyMemberとして新規作成したうえで、この家庭の家族回答へ追加する。
   * 紐づけ先の家庭は選択させず、常にこのカードの家庭（family.id）に登録する。
   * いずれの場合も、追加した時点で参加○・行き帰りとも送迎ありの状態で確定させる
   * （未回答の状態を経由しない）。
   */
  const handleAddTemporaryParticipant = async (input: {
    name: string;
    pickupLocationId: string;
    registerToMaster: boolean;
  }) => {
    if (input.registerToMaster) {
      const familyMemberId = await createFamilyMember({ familyId: family.id, name: input.name });
      onFamilyMemberRegistered({
        id: familyMemberId,
        familyId: family.id,
        name: input.name,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      applyFamilyMemberPatch(familyMemberId, {
        isParticipating: true,
        noOutwardRide: false,
        noReturnRide: false,
      });
    } else {
      const newParticipant: ResponseTemporaryParticipant = {
        id: crypto.randomUUID(),
        name: input.name,
        pickupLocationId: input.pickupLocationId,
        isParticipating: true,
        noOutwardRide: false,
        noReturnRide: false,
      };
      applyPatch({ temporaryParticipants: [...current.temporaryParticipants, newParticipant] });
    }
    setIsAddingTemporaryParticipant(false);
  };

  return (
    <Card as="section" id={`family-response-card-${family.id}`} style={{ padding: 0 }}>
      <button
        type="button"
        id={`family-response-card-header-${family.id}`}
        aria-expanded={isOpen}
        aria-controls={`family-response-card-body-${family.id}`}
        onClick={onToggleOpen}
        style={headerButtonStyle}
      >
        <span style={familyNameStyle}>
          <HomeIcon size={16} />
          {family.familyName}
        </span>
        <FamilyStatusChips
          status={status}
          driverOutward={current.driverOutward}
          driverReturn={current.driverReturn}
          playerList={playerList}
          responsePlayers={current.players}
          hasCoach={hasCoach}
          coachParticipating={current.coachParticipating}
          familyMemberList={familyMemberList}
          responseFamilyMembers={current.familyMembers}
        />
        <span aria-hidden="true" style={{ flexShrink: 0, color: 'var(--text)', display: 'flex', transform: isOpen ? undefined : 'rotate(-90deg)' }}>
          <ChevronDownIcon size={18} />
        </span>
      </button>

      {isOpen && (
        <div id={`family-response-card-body-${family.id}`} style={bodyWrapperStyle}>
          <DriverAndCapacitySection
            familyId={family.id}
            vehicleCapacity={family.vehicleCapacity}
            driverOutward={current.driverOutward}
            driverReturn={current.driverReturn}
            capacityToday={current.capacityToday}
            onChangeDriverOffer={(driverOutward, driverReturn) =>
              applyPatch({ driverOutward, driverReturn })
            }
            onChangeCapacityToday={(value) => applyPatch({ capacityToday: value })}
          />

          <hr style={dividerStyle} />

          <div
            id={`family-response-card-members-${family.id}`}
            style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            {playerList.map((player) => {
              const responsePlayer =
                current.players.find((c) => c.playerId === player.id) ??
                buildInitialResponsePlayer(player.id);

              return (
                <Card key={player.id} variant="compact" style={playerMemberBoxStyle}>
                  <span style={memberNameStyle}>
                    <UserIcon size={14} />
                    {player.name}
                    <span style={{ fontSize: '12px', fontWeight: 400 }}>
                      {formatGradeLabel(player.schoolEntryYear)}
                    </span>
                  </span>
                  <PlayerResponseRow
                    playerId={player.id}
                    isParticipating={responsePlayer.isParticipating}
                    noOutwardRide={responsePlayer.noOutwardRide}
                    noReturnRide={responsePlayer.noReturnRide}
                    onChangeIsParticipating={(value) =>
                      applyPlayerPatch(
                        player.id,
                        // 参加（○）にした瞬間、行き・帰りの送迎は両方ON（送迎あり）を既定にする
                        // （04_画面設計.md#7）。不参加（✕）にする場合は既存の送迎要否をそのまま保持する
                        value === true
                          ? { isParticipating: true, noOutwardRide: false, noReturnRide: false }
                          : { isParticipating: value }
                      )
                    }
                    onChangeNoOutwardRide={(value) =>
                      applyPlayerPatch(player.id, { noOutwardRide: value })
                    }
                    onChangeNoReturnRide={(value) =>
                      applyPlayerPatch(player.id, { noReturnRide: value })
                    }
                  />
                </Card>
              );
            })}

            {hasCoach && (
              <Card variant="compact" style={coachMemberBoxStyle}>
                <span style={memberNameStyle}>
                  <UserIcon size={14} />
                  {family.coachName}
                  <span style={{ fontSize: '12px', fontWeight: 400 }}>コーチ</span>
                </span>
                <CoachResponseRow
                  familyId={family.id}
                  coachParticipating={current.coachParticipating}
                  coachNoOutwardRide={current.coachNoOutwardRide}
                  coachNoReturnRide={current.coachNoReturnRide}
                  onChange={(value) =>
                    applyPatch(
                      // 参加（○）にした瞬間、行き・帰りの送迎は両方ON（送迎あり）を既定にする
                      // （04_画面設計.md#7）。不参加（✕）にする場合は既存の送迎要否をそのまま保持する
                      value === true
                        ? { coachParticipating: true, coachNoOutwardRide: false, coachNoReturnRide: false }
                        : { coachParticipating: value }
                    )
                  }
                  onChangeNoOutwardRide={(value) => applyPatch({ coachNoOutwardRide: value })}
                  onChangeNoReturnRide={(value) => applyPatch({ coachNoReturnRide: value })}
                />
              </Card>
            )}

            {familyMemberList.map((familyMember) => {
              const responseFamilyMember =
                current.familyMembers.find((f) => f.familyMemberId === familyMember.id) ??
                buildInitialResponseFamilyMember(familyMember.id);

              return (
                <Card key={familyMember.id} variant="compact" style={familyMemberBoxStyle}>
                  <span style={memberNameStyle}>
                    <UserIcon size={14} />
                    {familyMember.name}
                    <span style={{ fontSize: '12px', fontWeight: 400 }}>家族</span>
                  </span>
                  <FamilyMemberResponseRow
                    familyMemberId={familyMember.id}
                    isParticipating={responseFamilyMember.isParticipating}
                    noOutwardRide={responseFamilyMember.noOutwardRide}
                    noReturnRide={responseFamilyMember.noReturnRide}
                    onChangeIsParticipating={(value) =>
                      applyFamilyMemberPatch(
                        familyMember.id,
                        // 参加（○）にした瞬間、行き・帰りの送迎は両方ON（送迎あり）を既定にする
                        // （04_画面設計.md#7）。不参加（✕）にする場合は既存の送迎要否をそのまま保持する
                        value === true
                          ? { isParticipating: true, noOutwardRide: false, noReturnRide: false }
                          : { isParticipating: value }
                      )
                    }
                    onChangeNoOutwardRide={(value) =>
                      applyFamilyMemberPatch(familyMember.id, { noOutwardRide: value })
                    }
                    onChangeNoReturnRide={(value) =>
                      applyFamilyMemberPatch(familyMember.id, { noReturnRide: value })
                    }
                  />
                </Card>
              );
            })}

            {current.temporaryParticipants.map((temporaryParticipant) => (
              <Card key={temporaryParticipant.id} variant="compact" style={familyMemberBoxStyle}>
                <span style={memberNameStyle}>
                  <UserIcon size={14} />
                  {temporaryParticipant.name}
                  <span style={{ fontSize: '12px', fontWeight: 400 }}>家族</span>
                  <span style={{ flex: 1 }} />
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '999px',
                      background: 'rgba(138, 90, 168, 0.16)',
                      color: 'var(--parent-accent)',
                    }}
                  >
                    今回限り
                  </span>
                  <button
                    type="button"
                    aria-label={`${temporaryParticipant.name}を取り消す`}
                    onClick={() => handleRemoveTemporaryParticipant(temporaryParticipant.id)}
                    style={{
                      flexShrink: 0,
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text)',
                      opacity: 0.55,
                      cursor: 'pointer',
                      display: 'flex',
                      padding: 0,
                    }}
                  >
                    <CloseIcon size={15} />
                  </button>
                </span>
                <FamilyMemberResponseRow
                  familyMemberId={temporaryParticipant.id}
                  isParticipating={temporaryParticipant.isParticipating}
                  noOutwardRide={temporaryParticipant.noOutwardRide}
                  noReturnRide={temporaryParticipant.noReturnRide}
                  onChangeIsParticipating={(value) =>
                    applyTemporaryParticipantPatch(
                      temporaryParticipant.id,
                      value === true
                        ? { isParticipating: true, noOutwardRide: false, noReturnRide: false }
                        : { isParticipating: value }
                    )
                  }
                  onChangeNoOutwardRide={(value) =>
                    applyTemporaryParticipantPatch(temporaryParticipant.id, { noOutwardRide: value })
                  }
                  onChangeNoReturnRide={(value) =>
                    applyTemporaryParticipantPatch(temporaryParticipant.id, { noReturnRide: value })
                  }
                />
              </Card>
            ))}

            {isAddingTemporaryParticipant ? (
              <AddTemporaryParticipantForm
                familyId={family.id}
                defaultPickupLocationId={family.pickupLocationId}
                pickupLocationList={pickupLocationList}
                onSubmit={handleAddTemporaryParticipant}
                onCancel={() => setIsAddingTemporaryParticipant(false)}
              />
            ) : (
              <AddRow tint="family" onClick={() => setIsAddingTemporaryParticipant(true)}>
                + 今回だけ参加する人を追加
              </AddRow>
            )}
          </div>

          <hr style={dividerStyle} />

          <RemarksSection
            familyId={family.id}
            remarks={current.remarks}
            onChange={(value) => applyPatch({ remarks: value })}
          />
        </div>
      )}
    </Card>
  );
}
