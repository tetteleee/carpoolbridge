import type { CSSProperties, ReactNode } from 'react';

type AddRowTint = 'neutral' | 'player';

interface AddRowProps {
  onClick: () => void;
  /** neutral=役割色を持たない項目（集合場所・目的地・家庭）、player=選手色 */
  tint?: AddRowTint;
  children: ReactNode;
}

const baseStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '11px',
  borderRadius: '14px',
  background: 'transparent',
  fontFamily: 'var(--sans)',
  fontWeight: 700,
  fontSize: '13px',
  cursor: 'pointer',
  boxSizing: 'border-box',
};

const tintStyle: Record<AddRowTint, CSSProperties> = {
  neutral: { border: '1.5px dashed var(--border)', color: 'var(--text)' },
  player: { border: '1.5px dashed var(--player-border)', color: 'var(--player-accent)' },
};

/**
 * 一覧末尾に配置する追加行。個別の右寄せボタンの代わりに、
 * 一覧の流れの中でタップできる点線行として表示する（04_画面設計.md#10）。
 */
export function AddRow({ onClick, tint = 'neutral', children }: AddRowProps) {
  return (
    <button type="button" onClick={onClick} style={{ ...baseStyle, ...tintStyle[tint] }}>
      {children}
    </button>
  );
}
