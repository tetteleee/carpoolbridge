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

/** 右向きシェブロン（詳細遷移を示す）アイコン */
export function ChevronRightIcon({ size = 18 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <polyline points="9 5 16 12 9 19" />
    </svg>
  );
}

/** 下向きシェブロン（開閉トグルを示す）アイコン */
export function ChevronDownIcon({ size = 18 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <polyline points="5 9 12 16 19 9" />
    </svg>
  );
}

/** 左向きシェブロン（前の画面へ戻ることを示す）アイコン */
export function ChevronLeftIcon({ size = 18 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <polyline points="15 5 8 12 15 19" />
    </svg>
  );
}

/** 編集（鉛筆）アイコン */
export function EditIcon({ size = 18 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <path d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4z" />
      <line x1="13" y1="6.5" x2="17.5" y2="11" />
    </svg>
  );
}

/** ドラッグハンドル（並び替え可能を示す）アイコン */
export function DragHandleIcon({ size = 18 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

/** 共有アイコン */
export function ShareIcon({ size = 18 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <line x1="8.2" y1="10.8" x2="15.8" y2="6.2" />
      <line x1="8.2" y1="13.2" x2="15.8" y2="17.8" />
    </svg>
  );
}

/** 読み込み中インジケーター（3点パルス）。色は呼び出し元のtext colorを継承する */
export function LoadingIndicator({ size = 6 }: IconProps) {
  const dotStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    background: 'currentColor',
    animation: 'loading-dot-bounce 1.1s ease-in-out infinite',
  };
  return (
    <span
      role="status"
      aria-label="読み込み中"
      style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.7 }}
    >
      <span className="loading-dot" style={dotStyle} />
      <span className="loading-dot" style={{ ...dotStyle, animationDelay: '0.12s' }} />
      <span className="loading-dot" style={{ ...dotStyle, animationDelay: '0.24s' }} />
    </span>
  );
}

/** 閉じる（×）アイコン */
export function CloseIcon({ size = 18 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

/** アプリロゴアイコン（sizeは幅基準、高さは元SVGの比率452:276で計算） */
export function AppIcon({ size = 32 }: IconProps) {
  const width = size;
  const height = Math.round((size * 276) / 452);
  return (
    <svg width={width} height={height} viewBox="30 130 452 276" style={baseStyle} aria-hidden="true">
      <defs>
        <mask id="iconMask" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
          <g transform="translate(256 280) scale(1.18) translate(-256 -280)">
            <path
              d="M96 336
                 C88 336 82 330 82 322
                 L82 296
                 C82 288 87 281 95 279
                 L118 273
                 L150 214
                 C158 199 174 190 191 190
                 L321 190
                 C338 190 354 199 362 214
                 L394 273
                 L417 279
                 C425 281 430 288 430 296
                 L430 322
                 C430 330 424 336 416 336
                 Z"
              fill="white"
            />
            <g fill="none" stroke="black" strokeLinecap="round">
              <path d="M205 178 C240 220 240 300 205 340" strokeWidth="12" strokeDasharray="6 14" />
              <path d="M307 178 C272 220 272 300 307 340" strokeWidth="12" strokeDasharray="6 14" />
            </g>
            <circle cx="152" cy="336" r="34" fill="black" />
            <circle cx="152" cy="336" r="22" fill="white" />
            <circle cx="152" cy="336" r="10" fill="black" />
            <circle cx="360" cy="336" r="34" fill="black" />
            <circle cx="360" cy="336" r="22" fill="white" />
            <circle cx="360" cy="336" r="10" fill="black" />
          </g>
        </mask>
      </defs>
      <rect x="0" y="0" width="512" height="512" fill="#3d5a80" mask="url(#iconMask)" />
    </svg>
  );
}
