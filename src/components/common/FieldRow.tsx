import type { CSSProperties, ReactNode } from 'react';

interface FieldRowProps {
  label: string;
  /** ラベル列の幅（px）。項目名の長さに応じて呼び出し側で調整する */
  labelWidth?: number;
  children: ReactNode;
}

const rowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px' };

/**
 * ラベルを入力欄の左に横並びで配置する行。
 * 「ラベルを上に置く」従来の縦積みレイアウトより1項目あたりの縦幅を抑えられるため、
 * 登録情報の各編集画面で使う（04_画面設計.md#10）。
 * ルート要素は<label>とし、入力欄をネストすることで暗黙的なラベル関連付けを維持する
 * （スクリーンリーダー・テストのgetByLabel等がラベルテキストで入力欄を特定できるようにするため）。
 */
export function FieldRow({ label, labelWidth = 60, children }: FieldRowProps) {
  return (
    <label style={rowStyle}>
      <span
        style={{
          flexShrink: 0,
          width: labelWidth,
          fontSize: '12px',
          color: 'var(--text)',
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>{children}</span>
    </label>
  );
}
