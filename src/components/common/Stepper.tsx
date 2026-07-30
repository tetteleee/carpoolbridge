import type { CSSProperties, ReactNode } from 'react';

interface StepperProps {
  id?: string;
  /** 現在値 */
  value: number;
  /** 下限値（省略時は0） */
  min?: number;
  onChange: (next: number) => void;
  /** スクリーンリーダー向けラベル（減） */
  decrementLabel: string;
  /** スクリーンリーダー向けラベル（増） */
  incrementLabel: string;
  /** 値の右側に表示する単位（例：「人」） */
  unit?: ReactNode;
  /** 値テキストのスタイル上書き（例：変更済みを強調表示する等） */
  valueStyle?: CSSProperties;
  /** E2Eテスト等でDOM要素を特定するためのid（省略可） */
  decrementId?: string;
  incrementId?: string;
  valueId?: string;
}

const pillStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  background: 'var(--panel-bg)',
  border: '1px solid var(--border)',
  borderRadius: '999px',
  padding: '4px',
};

const circleButtonStyle: CSSProperties = {
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  border: 'none',
  background: 'var(--accent-bg)',
  color: 'var(--accent)',
  fontSize: '16px',
  fontWeight: 700,
  fontFamily: 'var(--sans)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const valueBaseStyle: CSSProperties = {
  minWidth: '34px',
  textAlign: 'center',
  fontSize: '14.5px',
  fontWeight: 800,
  color: 'var(--text-h)',
  fontFamily: 'var(--sans)',
};

/**
 * ピル型の外枠に丸ボタン（－／＋）を収めた数量ステッパー。
 * 乗車可能人数・通常定員など、数値を手入力ではなく増減で編集する項目に使う（04_画面設計.md#7, #10.4）。
 */
export function Stepper({
  id,
  value,
  min = 0,
  onChange,
  decrementLabel,
  incrementLabel,
  unit,
  valueStyle,
  decrementId,
  incrementId,
  valueId,
}: StepperProps) {
  const atMin = value <= min;

  return (
    <div id={id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={pillStyle}>
        <button
          id={decrementId}
          type="button"
          aria-label={decrementLabel}
          disabled={atMin}
          onClick={() => onChange(Math.max(min, value - 1))}
          style={{
            ...circleButtonStyle,
            opacity: atMin ? 'var(--disabled-opacity)' : 1,
            cursor: atMin ? 'default' : 'pointer',
          }}
        >
          －
        </button>
        <span id={valueId} style={{ ...valueBaseStyle, ...valueStyle }}>
          {value}
        </span>
        <button
          id={incrementId}
          type="button"
          aria-label={incrementLabel}
          onClick={() => onChange(value + 1)}
          style={circleButtonStyle}
        >
          ＋
        </button>
      </div>
      {unit !== undefined && (
        <span style={{ fontSize: '12px', color: 'var(--text)' }}>{unit}</span>
      )}
    </div>
  );
}
