import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Response, ResponsePlayer } from '../../types/event';
import type { Player, Family } from '../../types/master';
import { getSchoolGrade } from '../../utils/schoolGrade';
import { computeResponseStatus, type ResponseStatus } from '../../utils/responseStatus';
import { createResponse, updateResponse } from '../../services/event/responseService';
import { HomeIcon, UserIcon, ChevronDownIcon } from '../icons';
import { Card } from '../common/Card';
import { PlayerResponseRow } from './PlayerResponseRow';
import { CoachResponseRow } from './CoachResponseRow';
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
  /** 対象家庭の既存回答（未回答の場合はundefined） */
  response: Response | undefined;
  /** カードが展開表示かどうか（折りたたみ状態は呼び出し側で一括管理する） */
  isOpen: boolean;
  /** ヘッダー行タップ時に呼び出す開閉トグル */
  onToggleOpen: () => void;
  /** 回答状況（回答済み／一部回答／未回答）が変化した際に呼び出す（ヘッダー集計表示用） */
  onStatusChange: (status: ResponseStatus) => void;
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

/** 選手・コーチ1人ごとの回答をまとめる内側ボックスの共通スタイル */
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

/** 家庭の回答の初期値（既存回答が存在する場合はそれを使用し、なければ未回答の初期値を組み立てる） */
function buildInitialResponse(playerList: Player[], response: Response | undefined): Response {
  if (response) {
    return response;
  }
  return {
    driverOutward: null,
    driverReturn: null,
    capacityToday: null,
    coachParticipating: null,
    remarks: '',
    players: playerList.map((player) => buildInitialResponsePlayer(player.id)),
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
  response,
  isOpen,
  onToggleOpen,
  onStatusChange,
}: FamilyResponseCardProps) {
  const hasCoach = family.coachName !== null;
  const [current, setCurrent] = useState<Response>(() =>
    buildInitialResponse(playerList, response)
  );
  // 対象家庭のResponseドキュメントが既にFirestore上に存在するか（新規作成か更新かの判定に使用）
  const hasDocRef = useRef<boolean>(response !== undefined);

  // 回答状況（回答済み／一部回答／未回答）。変更の都度、呼び出し側（ヘッダー集計表示用）へ通知する
  const status = useMemo(
    () => computeResponseStatus(current, playerList, hasCoach),
    [current, playerList, hasCoach]
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
                  onChange={(value) => applyPatch({ coachParticipating: value })}
                />
              </Card>
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
