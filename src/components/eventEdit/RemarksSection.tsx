import type { CSSProperties } from 'react';

interface RemarksSectionProps {
  /** 対象家庭ID（DOM要素のid付与に使用） */
  familyId: string;
  /** 特記事項 */
  remarks: string;
  /** 特記事項の変更 */
  onChange: (value: string) => void;
}

const frameStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const labelStyle: CSSProperties = {
  fontSize: '13px',
  color: 'var(--text)',
};

const textareaStyle: CSSProperties = {
  width: '100%',
  minHeight: '32px',
  padding: '6px 8px',
  borderRadius: '6px',
  border: '1px solid var(--border)',
  fontSize: '16px',
  fontFamily: 'var(--sans)',
  color: 'var(--text-h)',
  background: 'transparent',
  boxSizing: 'border-box',
  resize: 'vertical',
};

/**
 * イベント編集（回答入力）画面・家庭カード内の
 * 備考（remarks）の自由記述入力欄。家庭単位で1つのみ配置し、子供個別の入力欄は設けない。
 * 値は呼び出し側（FamilyResponseCard）が保持し、変更の都度Firestoreへ自動保存される（T29）。
 */
export function RemarksSection({
  familyId,
  remarks,
  onChange,
}: RemarksSectionProps) {
  return (
    <div id={`remarks-frame-${familyId}`} style={frameStyle}>
      <span style={labelStyle}>備考</span>
      <textarea
        id={`remarks-input-${familyId}`}
        value={remarks}
        onChange={(e) => onChange(e.target.value)}
        style={textareaStyle}
      />
    </div>
  );
}
