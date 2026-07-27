import type { CSSProperties } from 'react';

interface ChildResponseRowProps {
  /** 対象子供ID（DOM要素のid付与に使用） */
  childId: string;
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
  justifyContent: 'space-between',
  gap: '8px',
};

const rowLabelStyle: CSSProperties = {
  fontSize: '13px',
  color: 'var(--text)',
};

const choiceButtonBaseStyle: CSSProperties = {
  minHeight: '44px',
  padding: '0 10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '6px',
  fontSize: '13px',
  fontFamily: 'var(--sans)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
};

const choicePositiveSelectedStyle: CSSProperties = {
  border: '1px solid var(--positive-border)',
  background: 'var(--positive-bg)',
  color: 'var(--positive)',
  fontWeight: 700,
};

const choiceNegativeSelectedStyle: CSSProperties = {
  border: '1px solid var(--negative-border)',
  background: 'var(--negative-bg)',
  color: 'var(--negative)',
  fontWeight: 700,
};

const choiceUnselectedStyle: CSSProperties = {
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--text)',
  fontWeight: 400,
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
 * 子供ごとの参加（3状態）・行き／帰りの送迎要否（ミニスイッチ）。
 * 値は呼び出し側（FamilyResponseCard）が保持し、変更の都度Firestoreへ自動保存される（T29）。
 */
export function ChildResponseRow({
  childId,
  isParticipating,
  noOutwardRide,
  noReturnRide,
  onChangeIsParticipating,
  onChangeNoOutwardRide,
  onChangeNoReturnRide,
}: ChildResponseRowProps) {
  // 送迎要否スイッチは「参加」が○（true）の場合のみ意味を持つため、
  // ○以外（✕・未回答）では操作不可にする。値自体は保持し、○に戻せば復元される。
  const rideSwitchDisabled = isParticipating !== true;

  return (
    <div
      id={`child-response-frame-${childId}`}
      style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
    >
      <div style={rowStyle}>
        <span style={rowLabelStyle}>参加</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              id={`child-participating-yes-${childId}`}
              type="button"
              aria-pressed={isParticipating === true}
              onClick={() => onChangeIsParticipating(true)}
              style={{
                ...choiceButtonBaseStyle,
                ...(isParticipating === true
                  ? choicePositiveSelectedStyle
                  : choiceUnselectedStyle),
              }}
            >
              ○参加
            </button>
            <button
              id={`child-participating-no-${childId}`}
              type="button"
              aria-pressed={isParticipating === false}
              onClick={() => onChangeIsParticipating(false)}
              style={{
                ...choiceButtonBaseStyle,
                ...(isParticipating === false
                  ? choiceNegativeSelectedStyle
                  : choiceUnselectedStyle),
              }}
            >
              ✕不参加
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <RideSwitch
              id={`no-outward-ride-${childId}`}
              label="行"
              ariaLabel="行きの送迎"
              noRide={noOutwardRide}
              disabled={rideSwitchDisabled}
              onChange={onChangeNoOutwardRide}
            />
            <RideSwitch
              id={`no-return-ride-${childId}`}
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
