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

/**
 * 上下2枚の影を重ねて「浮いている」印象を作る。枠線は使わず、影だけで背景から
 * カードを浮かせる（下側の影を強めにして光源が上にあるように見せる）。
 */
const baseStyle: CSSProperties = {
  boxSizing: 'border-box',
  boxShadow: '0 -1px 2px rgba(0, 0, 0, 0.02), 0 6px 16px rgba(0, 0, 0, 0.10)',
  background: 'var(--bg)',
};

/**
 * `background: cond ? 'x' : undefined` のように呼び出し側が状態分岐で
 * styleを書くと、値がundefinedでもキー自体は残るため、スプレッドで
 * baseStyleの値を消してしまう（backgroundが透明になり背景色が透ける）。
 * それを防ぐため、値がundefinedのキーはマージ対象から除く。
 */
function omitUndefined(style?: CSSProperties): CSSProperties {
  if (!style) return {};
  return Object.fromEntries(
    Object.entries(style).filter(([, value]) => value !== undefined)
  ) as CSSProperties;
}

/**
 * アプリ共通のカード。角丸・影をここで一元管理する（枠線は使わない）。
 * 個別の見た目差分（背景色の上書き等）はstyleで上書きする。
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
      style={{ ...baseStyle, ...variantStyle[variant], ...omitUndefined(style as CSSProperties) }}
      {...rest}
    >
      {children}
    </Component>
  );
}
