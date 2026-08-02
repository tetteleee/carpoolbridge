import type { CSSProperties, ReactNode } from 'react';
import { ChevronRightIcon } from '../icons';
import { Card } from './Card';

interface CollapsibleListRowProps {
  /** 行頭に表示するアイコン */
  icon: ReactNode;
  /** アイコン背景色（例：'var(--accent-bg)'） */
  iconBg: string;
  /** アイコン色（例：'var(--accent)'） */
  iconColor: string;
  /** タイトル（太字。通常は文字列だが、在籍状態に応じた薄字表示などのためReactNodeも許容する） */
  title: ReactNode;
  /** タイトル下に表示する補足情報 */
  meta?: ReactNode;
  /** 展開状態 */
  expanded: boolean;
  onToggle: () => void;
  /** ヘッダー右側、シェブロンの左に表示する要素（ステータスバッジ等） */
  trailing?: ReactNode;
  /** 展開時のみ表示する詳細コンテンツ */
  children: ReactNode;
}

const headerButtonStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 12px',
  border: 'none',
  background: 'transparent',
  textAlign: 'left',
  cursor: 'pointer',
  font: 'inherit',
  color: 'inherit',
  boxSizing: 'border-box',
};

const iconChipStyle: CSSProperties = {
  width: '30px',
  height: '30px',
  borderRadius: '9px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

/**
 * 折りたたみ可能な一覧行。通常は1行のサマリーのみ表示し、タップで詳細（children）を展開する。
 * 集合場所・目的地・家庭の各編集画面で共通に使う（04_画面設計.md#10 登録情報）。
 */
export function CollapsibleListRow({
  icon,
  iconBg,
  iconColor,
  title,
  meta,
  expanded,
  onToggle,
  trailing,
  children,
}: CollapsibleListRowProps) {
  return (
    <Card style={{ padding: 0 }}>
      <button type="button" aria-expanded={expanded} onClick={onToggle} style={headerButtonStyle}>
        <span style={{ ...iconChipStyle, background: iconBg, color: iconColor }}>{icon}</span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-h)' }}>{title}</span>
          {meta && <span style={{ fontSize: '11.5px', color: 'var(--text)' }}>{meta}</span>}
        </span>
        {trailing}
        <span
          style={{
            flexShrink: 0,
            display: 'flex',
            color: 'var(--text)',
            transform: expanded ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        >
          <ChevronRightIcon size={16} />
        </span>
      </button>
      {expanded && (
        <div style={{ padding: '0 12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {children}
        </div>
      )}
    </Card>
  );
}
