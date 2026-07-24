import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';
type ButtonSize = 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 強調度。primary=画面の主要操作（保存・配車作成等）、secondary=通常操作、danger=削除等の警告を伴う操作 */
  variant?: ButtonVariant;
  /** サイズ。md=通常、sm=一覧内の追加ボタンなど控えめな操作 */
  size?: ButtonSize;
  /** ラベル前に表示するアイコン */
  icon?: ReactNode;
}

const variantStyle: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '999px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--text-h)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
  },
  danger: {
    background: 'var(--negative)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
  },
};

const sizeStyle: Record<ButtonSize, CSSProperties> = {
  md: { padding: '12px 28px', fontSize: '15px', minHeight: '44px' },
  sm: { padding: '8px 16px', fontSize: '13px', minHeight: '36px' },
};

/**
 * アプリ共通のボタン。色・形・サイズをここで一元管理する。
 * ○参加／✕不参加のような選択式ボタン、在籍中トグル、タブ、
 * アイコンのみの丸ボタンは操作の性質が異なるため対象外（現状のまま個別実装）。
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  disabled,
  style,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        fontWeight: 700,
        fontFamily: 'var(--sans)',
        whiteSpace: 'nowrap',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 'var(--disabled-opacity)' : 1,
        boxSizing: 'border-box',
        ...variantStyle[variant],
        ...sizeStyle[size],
        ...style,
      }}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
