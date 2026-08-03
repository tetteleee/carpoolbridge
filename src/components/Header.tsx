import type { CSSProperties, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon, ChevronLeftIcon } from './icons';

interface HeaderProps {
  /** 画面タイトル。長い場合は1行で省略表示される */
  title: string;
  /** タイトルのフォントサイズ。未指定時は既定の20px */
  titleFontSize?: string;
  /** ルート画面（ホーム）のみ指定。指定時はタイトル左にアプリアイコンを表示する */
  showAppIcon?: boolean;
  /** サブ画面のみ指定。指定時はタイトル左に戻るボタン（アイコンのみ）を表示する */
  backTo?: string;
  /** 指定時、戻るボタン押下時にnavigate(backTo)の代わりに呼び出す（未保存確認など、遷移前に割り込みたい画面用） */
  onBackClick?: () => void;
  /** タイトル行右側に表示する任意要素（件数チップなど） */
  trailing?: ReactNode;
  /** 指定時、titleの代わりにタイトル欄へ表示する任意コンテンツ（日時＋タイトル＋場所の複数行表示など） */
  titleContent?: ReactNode;
}

/** 戻るボタン・アプリアイコンで共通の円形ボタンスタイル（タップしやすい44px角） */
const iconButtonStyle: CSSProperties = {
  flexShrink: 0,
  width: '44px',
  height: '44px',
  padding: 0,
  borderRadius: '999px',
  border: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

/**
 * 全画面共通のヘッダー本体（アプリアイコン or 戻るボタン＋タイトル＋任意の右側要素）。
 * position: sticky や padding、border-bottomなど外枠のスタイルは呼び出し側で用意する。
 */
export function Header({
  title,
  titleFontSize,
  showAppIcon,
  backTo,
  onBackClick,
  trailing,
  titleContent,
}: HeaderProps) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      {backTo && (
        <button
          type="button"
          onClick={() => (onBackClick ? onBackClick() : navigate(backTo))}
          aria-label="戻る"
          style={{
            ...iconButtonStyle,
            background: 'var(--bg)',
            color: 'var(--text-h)',
            boxShadow: 'var(--shadow)',
            cursor: 'pointer',
          }}
        >
          <ChevronLeftIcon size={20} />
        </button>
      )}
      {showAppIcon && !backTo && (
        <button
          type="button"
          aria-label="ページを更新"
          onClick={() => window.location.reload()}
          style={{
            ...iconButtonStyle,
            border: 'none',
            background: 'rgba(61, 90, 128, 0.08)',
            cursor: 'pointer',
          }}
        >
          <AppIcon size={32} />
        </button>
      )}
      {titleContent ?? (
        <h1
          style={{
            margin: 0,
            flex: 1,
            minWidth: 0,
            fontSize: titleFontSize ?? '20px',
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
      )}
      {trailing}
    </div>
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
