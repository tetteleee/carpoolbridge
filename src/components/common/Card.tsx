import type { ComponentPropsWithoutRef, CSSProperties, ElementType, ReactNode } from 'react';

type CardVariant = 'default' | 'compact';

type CardOwnProps<E extends ElementType> = {
  /** ルート要素のタグ名。クリック可能な一覧行はbutton、それ以外はdiv/sectionを指定する */
  as?: E;
  /** default=一覧の主要カード（角丸16px）、compact=カード内にネストする補助カード（角丸8px） */
  variant?: CardVariant;
  children?: ReactNode;
};

type CardProps<E extends ElementType> = CardOwnProps<E> &
  Omit<ComponentPropsWithoutRef<E>, keyof CardOwnProps<E>>;

const variantStyle: Record<CardVariant, CSSProperties> = {
  default: { borderRadius: '16px' },
  compact: { borderRadius: '8px' },
};

const baseStyle: CSSProperties = {
  boxSizing: 'border-box',
  border: '1px solid var(--card-border)',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  background: 'var(--bg)',
};

/**
 * アプリ共通のカード。枠線・角丸・影をここで一元管理する。
 * 個別の見た目差分（枠線色の変更・背景色の上書き等）はstyleで上書きする。
 */
export function Card<E extends ElementType = 'div'>({
  as,
  variant = 'default',
  style,
  children,
  ...rest
}: CardProps<E>) {
  const Component = (as ?? 'div') as ElementType;

  return (
    <Component
      style={{ ...baseStyle, ...variantStyle[variant], ...(style as CSSProperties) }}
      {...rest}
    >
      {children}
    </Component>
  );
}
