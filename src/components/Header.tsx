import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { CarIcon, ChevronLeftIcon } from './icons';

interface HeaderProps {
  /** 画面タイトル。長い場合は1行で省略表示される */
  title: string;
  /** ルート画面（ホーム）のみ指定。指定時はタイトル行の上にブランドバッジを表示する */
  badge?: string;
  /** サブ画面のみ指定。指定時はタイトル左に戻るボタン（アイコンのみ）を表示する */
  backTo?: string;
  /** タイトル行右側に表示する任意要素（件数チップなど） */
  trailing?: ReactNode;
}

/**
 * 全画面共通のヘッダー本体（バッジ or 戻るボタン＋タイトル＋任意の右側要素）。
 * position: sticky や padding、border-bottomなど外枠のスタイルは呼び出し側で用意する。
 */
export function Header({ title, badge, backTo, trailing }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <>
      {badge && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '999px',
            background: 'var(--accent-bg)',
            color: 'var(--accent)',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <CarIcon size={14} />
          {badge}
        </span>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginTop: badge ? '10px' : 0,
        }}
      >
        {backTo && (
          <button
            type="button"
            onClick={() => navigate(backTo)}
            aria-label="戻る"
            style={{
              flexShrink: 0,
              width: '32px',
              height: '32px',
              padding: 0,
              borderRadius: '999px',
              border: 'none',
              background: 'var(--code-bg)',
              color: 'var(--text-h)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ChevronLeftIcon size={16} />
          </button>
        )}
        <h1
          style={{
            margin: 0,
            flex: 1,
            minWidth: 0,
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: '0.015em',
            color: 'var(--text-h)',
            textAlign: 'left',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </h1>
        {trailing}
      </div>
    </>
  );
}

/** ヘッダー右側に添える件数・状態などの丸チップ */
export function HeaderChip({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        flexShrink: 0,
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--text)',
        background: 'var(--code-bg)',
        padding: '4px 11px',
        borderRadius: '999px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}
