import type { CSSProperties } from 'react';

interface SwitchProps {
  /** ON/OFFの現在値 */
  checked: boolean;
  /** タップ時に呼ばれる（次の値の計算は呼び出し側が行う） */
  onChange: () => void;
  /** スクリーンリーダー向けラベル */
  ariaLabel?: string;
  id?: string;
}

const trackStyle: CSSProperties = {
  position: 'relative',
  width: '42px',
  height: '25px',
  borderRadius: '999px',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'background 0.18s ease',
};

const knobStyle: CSSProperties = {
  position: 'absolute',
  top: '2px',
  left: '2px',
  width: '21px',
  height: '21px',
  borderRadius: '50%',
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
  transition: 'transform 0.18s ease',
};

/**
 * iOS風のON/OFFトグルスイッチ。文言は表示せず、ノブの位置と色（ON＝positive／OFF＝border）
 * だけで状態を示す（04_画面設計.md#10.4）。
 */
export function Switch({ checked, onChange, ariaLabel, id }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      style={{
        ...trackStyle,
        background: checked ? 'var(--positive)' : 'var(--border)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          ...knobStyle,
          transform: checked ? 'translateX(17px)' : 'translateX(0)',
        }}
      />
    </button>
  );
}
