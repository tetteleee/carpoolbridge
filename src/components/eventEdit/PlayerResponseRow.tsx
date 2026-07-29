import type { CSSProperties } from 'react';
import { CheckIcon, CloseIcon } from '../icons';

interface PlayerResponseRowProps {
  /** 対象選手ID（DOM要素のid付与に使用） */
  playerId: string;
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

const switchButtonStyle: CSSProperties = {
  position: 'relative',
  width: '40px',
  minHeight: '44px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  borderRadius: '10px',
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  fontFamily: 'var(--sans)',
  cursor: 'pointer',
};

const switchLabelOnStyle: CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  color: 'var(--text)',
};

const switchLabelOffStyle: CSSProperties = {
  fontSize: '10px',
  fontWeight: 800,
  color: 'var(--warning)',
};

const switchTrackStyle: CSSProperties = {
  width: '24px',
  height: '14px',
  borderRadius: '7px',
  position: 'relative',
};

const switchKnobStyle: CSSProperties = {
  position: 'absolute',
  top: '1px',
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  background: '#fff',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
};

const switchOffDotStyle: CSSProperties = {
  position: 'absolute',
  top: '3px',
  right: '4px',
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: 'var(--warning)',
};

interface RideSwitchProps {
  /** DOM要素のid */
  id: string;
  /** スイッチ上に表示する方向ラベル（「行」「帰」） */
  label: string;
  /** スクリーンリーダー向けの完全なラベル */
  ariaLabel: string;
  /** 行き（または帰り）の配車が不要かどうか（保存値そのもの） */
  noRide: boolean;
  disabled: boolean;
  onChange: (noRide: boolean) => void;
}

/**
 * 行き／帰りの送迎要否を表すミニスイッチ。
 * ON＝送迎あり（既定・肯定表現）、OFF＝配車不要（現地集合・保護者お迎え等の例外）を表す。
 * 「ONにすると不要になる」という否定的な対応にはしない（04_画面設計.md#7）。
 */
function RideSwitch({ id, label, ariaLabel, noRide, disabled, onChange }: RideSwitchProps) {
  const rideOn = !noRide;
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={rideOn}
      aria-label={ariaLabel}
      disabled={disabled}
      // トグル後の新しいnoRide値は、トグル前のrideOnの値と等しい
      onClick={() => onChange(rideOn)}
      style={{
        ...switchButtonStyle,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {!rideOn && <span aria-hidden="true" style={switchOffDotStyle} />}
      <span style={rideOn ? switchLabelOnStyle : switchLabelOffStyle}>{label}</span>
      <span style={{ ...switchTrackStyle, background: rideOn ? 'var(--positive)' : 'var(--border)' }}>
        <span style={{ ...switchKnobStyle, left: rideOn ? '11px' : '1px' }} />
      </span>
    </button>
  );
}

/**
 * イベント編集（回答入力）画面・家庭カード内の
 * 選手ごとの参加（3状態）・行き／帰りの送迎要否（ミニスイッチ）。
 * 値は呼び出し側（FamilyResponseCard）が保持し、変更の都度Firestoreへ自動保存される（T29）。
 */
export function PlayerResponseRow({
  playerId,
  isParticipating,
  noOutwardRide,
  noReturnRide,
  onChangeIsParticipating,
  onChangeNoOutwardRide,
  onChangeNoReturnRide,
}: PlayerResponseRowProps) {
  // 送迎要否スイッチは「参加」が○（true）の場合のみ意味を持つため、
  // ○以外（✕・未回答）では操作不可にする。値自体は保持し、○に戻せば復元される。
  const rideSwitchDisabled = isParticipating !== true;

  return (
    <div
      id={`player-response-frame-${playerId}`}
      style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
    >
      <div style={rowStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={segmentTrackStyle}>
            <button
              id={`player-participating-yes-${playerId}`}
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
            <button
              id={`player-participating-no-${playerId}`}
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
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <RideSwitch
              id={`no-outward-ride-${playerId}`}
              label="行"
              ariaLabel="行きの送迎"
              noRide={noOutwardRide}
              disabled={rideSwitchDisabled}
              onChange={onChangeNoOutwardRide}
            />
            <RideSwitch
              id={`no-return-ride-${playerId}`}
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
