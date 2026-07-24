import type { Direction } from '../../types/event';

interface DirectionToggleProps {
  /** 選択中の方向（行き／帰り） */
  direction: Direction;
  /** 選択方向の変更時に呼び出すコールバック */
  onChange: (direction: Direction) => void;
}

const TABS: { direction: Direction; label: string }[] = [
  { direction: 'OUTWARD', label: '行き' },
  { direction: 'RETURN', label: '帰り' },
];

/**
 * 配車画面（メイン）の「行き」「帰り」切り替えボタン。
 * ヘッダーではなく画面上部（配車結果一覧の直前）に配置する。
 */
export function DirectionToggle({ direction, onChange }: DirectionToggleProps) {
  const selectedIndex = TABS.findIndex((tab) => tab.direction === direction);

  return (
    <div
      role="tablist"
      style={{
        position: 'relative',
        display: 'flex',
        gap: '2px',
        padding: '3px',
        background: '#eeeeee',
        borderRadius: '999px',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '3px',
          bottom: '3px',
          left: '3px',
          width: `calc(50% - 3px)`,
          background: 'var(--accent)',
          borderRadius: '999px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          transform: `translateX(${selectedIndex * 100}%)`,
          transition: 'transform 0.18s ease',
        }}
      />
      {TABS.map((tab) => {
        const selected = tab.direction === direction;
        return (
          <button
            key={tab.direction}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.direction)}
            style={{
              position: 'relative',
              zIndex: 1,
              flex: 1,
              border: 'none',
              background: 'transparent',
              padding: '9px 0',
              borderRadius: '999px',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'var(--sans)',
              color: selected ? '#fff' : 'var(--text)',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
