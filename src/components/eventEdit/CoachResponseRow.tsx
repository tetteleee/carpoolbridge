import type { CSSProperties } from 'react';
import { CheckIcon, CloseIcon } from '../icons';
import { RideSwitch } from './RideSwitch';

interface CoachResponseRowProps {
  /** 対象コーチID（DOM要素のid付与に使用） */
  coachId: string;
  /** イベントに参加するかどうか。未選択=null */
  isParticipating: boolean | null;
  /** 行きの配車が不要かどうか */
  noOutwardRide: boolean;
  /** 帰りの配車が不要かどうか */
  noReturnRide: boolean;
  /** 参加有無の変更 */
  onChangeIsParticipating: (value: boolean) => void;
  /** 行きの配車不要チェックの変更 */
  onChangeNoOutwardRide: (value: boolean) => void;
  /** 帰りの配車不要チェックの変更 */
  onChangeNoReturnRide: (value: boolean) => void;
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

/** iOSセグメントコントロール風の外枠（トラック）。中に選択肢のピルボタンを並べる */
const segmentTrackStyle: CSSProperties = {
  display: 'inline-flex',
  background: 'var(--border)',
  borderRadius: '12px',
  padding: '3px',
  gap: '2px',
};

/** セグメントコントロール内の各選択肢ボタン（未選択時は枠なし・透明） */
const segmentButtonBaseStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  minHeight: '38px',
  padding: '0 10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  borderRadius: '9px',
  fontSize: '13px',
  fontFamily: 'var(--sans)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  color: 'var(--text)',
  fontWeight: 400,
};

/** 選択中のセグメントは白背景で浮き上がらせ、色は選択肢の意味（参加＝positive等）で変える */
const segmentSelectedStyle: CSSProperties = {
  background: 'var(--bg)',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
  fontWeight: 700,
};

/**
 * イベント編集（回答入力）画面・家庭カード内の
 * コーチごとの参加（3状態）・行き／帰りの送迎要否（ミニスイッチ）。
 * 選手（PlayerResponseRow）・家族（FamilyMemberResponseRow）と全く同じ構造・操作方法とする。
 * 値は呼び出し側（FamilyResponseCard）が保持し、変更の都度Firestoreへ自動保存される。
 */
export function CoachResponseRow({
  coachId,
  isParticipating,
  noOutwardRide,
  noReturnRide,
  onChangeIsParticipating,
  onChangeNoOutwardRide,
  onChangeNoReturnRide,
}: CoachResponseRowProps) {
  // 送迎要否スイッチは「参加」が○（true）の場合のみ意味を持つため、
  // ○以外（✕・未回答）では操作不可にする。値自体は保持し、○に戻せば復元される。
  const rideSwitchDisabled = isParticipating !== true;

  return (
    <div
      id={`coach-response-frame-${coachId}`}
      style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
    >
      <div style={rowStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 並び順は「不参加」→「参加」。行き・帰りミニスイッチ（ON＝右側）と同じ「肯定＝右」の向きに揃える（04_画面設計.md#7） */}
          <div style={segmentTrackStyle}>
            <button
              id={`coach-participating-no-${coachId}`}
              type="button"
              aria-pressed={isParticipating === false}
              onClick={() => onChangeIsParticipating(false)}
              style={{
                ...segmentButtonBaseStyle,
                ...(isParticipating === false
                  ? { ...segmentSelectedStyle, color: 'var(--negative)' }
                  : {}),
              }}
            >
              {isParticipating === false && <CloseIcon size={14} />}
              不参加
            </button>
            <button
              id={`coach-participating-yes-${coachId}`}
              type="button"
              aria-pressed={isParticipating === true}
              onClick={() => onChangeIsParticipating(true)}
              style={{
                ...segmentButtonBaseStyle,
                ...(isParticipating === true
                  ? { ...segmentSelectedStyle, color: 'var(--positive)' }
                  : {}),
              }}
            >
              {isParticipating === true && <CheckIcon size={14} />}
              参加
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <RideSwitch
              id={`coach-no-outward-ride-${coachId}`}
              label="行"
              ariaLabel="行きの送迎"
              noRide={noOutwardRide}
              disabled={rideSwitchDisabled}
              onChange={onChangeNoOutwardRide}
            />
            <RideSwitch
              id={`coach-no-return-ride-${coachId}`}
              label="帰"
              ariaLabel="帰りの送迎"
              noRide={noReturnRide}
              disabled={rideSwitchDisabled}
              onChange={onChangeNoReturnRide}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
