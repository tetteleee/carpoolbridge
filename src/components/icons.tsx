import type { CSSProperties, SVGProps } from 'react';

interface IconProps {
  /** アイコンの一辺のサイズ（px） */
  size?: number;
}

const baseStyle: CSSProperties = { flexShrink: 0 };

function baseProps(size: number): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style: baseStyle,
    'aria-hidden': true,
  };
}

/** 設定（マスタ管理）アイコン */
export function SettingsIcon({ size = 18 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <circle cx="9" cy="6" r="2" fill="var(--bg)" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="15" cy="12" r="2" fill="var(--bg)" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="7" cy="18" r="2" fill="var(--bg)" />
    </svg>
  );
}

/** 集合場所アイコン */
export function MapPinIcon({ size = 18 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <path d="M12 21s-7-7.4-7-12a7 7 0 0 1 14 0c0 4.6-7 12-7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

/** 目的地アイコン */
export function FlagIcon({ size = 18 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <line x1="5" y1="3" x2="5" y2="21" />
      <path d="M5 4h13l-3 4 3 4H5" />
    </svg>
  );
}

/** 家庭アイコン */
export function HomeIcon({ size = 18 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.5V20a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

/** 子供（人物）アイコン */
export function UserIcon({ size = 18 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <circle cx="12" cy="8" r="3" />
      <path d="M6 20c0-3.5 2.7-6 6-6s6 2.5 6 6" />
    </svg>
  );
}

/** 開発用機能アイコン */
export function CodeIcon({ size = 18 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <polyline points="8 6 3 12 8 18" />
      <polyline points="16 6 21 12 16 18" />
    </svg>
  );
}

/** 配車（車）アイコン */
export function CarIcon({ size = 18 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <path d="M4 16v-3.2a1.5 1.5 0 0 1 .9-1.37l1.35-.58 1.4-2.8A2 2 0 0 1 9.44 7h5.12a2 2 0 0 1 1.79 1.05l1.4 2.8 1.35.58a1.5 1.5 0 0 1 .9 1.37V16" />
      <path d="M4 16h16" />
      <path d="M4 16v1.5A1.5 1.5 0 0 0 5.5 19a1.5 1.5 0 0 0 1.5-1.5V16" />
      <path d="M17 16v1.5a1.5 1.5 0 0 0 1.5 1.5 1.5 1.5 0 0 0 1.5-1.5V16" />
    </svg>
  );
}

/** 変更済みアイコン（鉛筆） */
export function PencilIcon({ size = 18 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <path d="M4 20l1-4.5L15.5 5 19 8.5 8.5 19 4 20z" />
      <path d="M13.5 6.5 17.5 10.5" />
    </svg>
  );
}

/** 右向きシェブロン（詳細遷移を示す）アイコン */
export function ChevronRightIcon({ size = 18 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <polyline points="9 5 16 12 9 19" />
    </svg>
  );
}
