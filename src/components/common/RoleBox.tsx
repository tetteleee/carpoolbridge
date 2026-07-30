import type { CSSProperties, ReactNode } from 'react';

type Role = 'player' | 'coach';

interface RoleBoxProps {
  role: Role;
  children: ReactNode;
}

const roleStyle: Record<Role, CSSProperties> = {
  player: {
    background: 'var(--player-bg)',
    border: '1px solid var(--player-border)',
    borderLeft: '4px solid var(--player-accent)',
  },
  coach: {
    background: 'var(--coach-bg)',
    border: '1px solid var(--coach-border)',
    borderLeft: '4px solid var(--coach-accent)',
  },
};

/**
 * 選手・コーチの役割色（背景＋枠線＋左帯）を持つボックス。
 * 配車画面・回答編集画面と同じ役割色を使う（04_画面設計.md#色分けルール）。
 */
export function RoleBox({ role, children }: RoleBoxProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '7px',
        padding: '9px 10px',
        borderRadius: '10px',
        ...roleStyle[role],
      }}
    >
      {children}
    </div>
  );
}
