import { useState, type CSSProperties } from 'react';

interface RemarksSectionProps {
  /** 対象家庭ID（DOM要素のid付与に使用） */
  familyId: string;
  /** 初期表示に用いる既存回答のremarks（対象家庭が未回答の場合はundefined） */
  initialRemarks: string | undefined;
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
  fontSize: '14px',
  fontFamily: 'var(--sans)',
  color: 'var(--text-h)',
  background: 'transparent',
  boxSizing: 'border-box',
  resize: 'vertical',
};

/**
 * イベント編集（回答入力）画面・家庭カード内の
 * 備考（remarks）の自由記述入力欄。家庭単位で1つのみ配置し、子供個別の入力欄は設けない。
 * 既存回答（Response.remarks）が存在する場合は、その値を初期値として反映する。
 * ここでの状態は画面内のみで保持し、Firestoreへの保存はT29で実装する。
 */
export function RemarksSection({
  familyId,
  initialRemarks,
}: RemarksSectionProps) {
  const [remarks, setRemarks] = useState<string>(initialRemarks ?? '');

  return (
    <div id={`remarks-frame-${familyId}`} style={frameStyle}>
      <span style={labelStyle}>備考</span>
      <textarea
        id={`remarks-input-${familyId}`}
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        style={textareaStyle}
      />
    </div>
  );
}
