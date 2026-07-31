import type { CSSProperties } from 'react';

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
 * 行き／帰りの送迎要否を表すミニスイッチ。選手・コーチ共通で使用する。
 * ON＝送迎あり（既定・肯定表現）、OFF＝配車不要（現地集合・保護者お迎え等の例外）を表す。
 * 「ONにすると不要になる」という否定的な対応にはしない（04_画面設計.md#7）。
 */
export function RideSwitch({ id, label, ariaLabel, noRide, disabled, onChange }: RideSwitchProps) {
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
