import type { CSSProperties } from 'react';

interface CoachResponseRowProps {
  /** 対象家庭ID（DOM要素のid付与に使用） */
  familyId: string;
  /** コーチが参加するかどうか。未選択=null */
  coachParticipating: boolean | null;
  /** 参加有無の変更 */
  onChange: (value: boolean) => void;
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
};

const rowLabelStyle: CSSProperties = {
  fontSize: '13px',
  color: 'var(--text)',
};

const choiceButtonBaseStyle: CSSProperties = {
  minHeight: '44px',
  padding: '0 10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '6px',
  fontSize: '13px',
  fontFamily: 'var(--sans)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
};

const choicePositiveSelectedStyle: CSSProperties = {
  border: '1px solid var(--positive-border)',
  background: 'var(--positive-bg)',
  color: 'var(--positive)',
  fontWeight: 700,
};

const choiceNegativeSelectedStyle: CSSProperties = {
  border: '1px solid var(--negative-border)',
  background: 'var(--negative-bg)',
  color: 'var(--negative)',
  fontWeight: 700,
};

const choiceUnselectedStyle: CSSProperties = {
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text)',
  fontWeight: 400,
};

/**
 * イベント編集（回答入力）画面・家庭カード内の
 * コーチの参加（3状態）ボタン。呼び出し側（FamilyResponseCard）で
 * Family.coachNameが設定されている家庭のみ表示する。
 * 値は呼び出し側が保持し、変更の都度Firestoreへ自動保存される（T29）。
 */
export function CoachResponseRow({
  familyId,
  coachParticipating,
  onChange,
}: CoachResponseRowProps) {
  return (
    <div
      id={`coach-response-frame-${familyId}`}
      style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
    >
      <div style={rowStyle}>
        <span style={rowLabelStyle}>参加</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            id={`coach-participating-yes-${familyId}`}
            type="button"
            aria-pressed={coachParticipating === true}
            onClick={() => onChange(true)}
            style={{
              ...choiceButtonBaseStyle,
              ...(coachParticipating === true
                ? choicePositiveSelectedStyle
                : choiceUnselectedStyle),
            }}
          >
            ○参加
          </button>
          <button
            id={`coach-participating-no-${familyId}`}
            type="button"
            aria-pressed={coachParticipating === false}
            onClick={() => onChange(false)}
            style={{
              ...choiceButtonBaseStyle,
              ...(coachParticipating === false
                ? choiceNegativeSelectedStyle
                : choiceUnselectedStyle),
            }}
          >
            ✕不参加
          </button>
        </div>
      </div>
    </div>
  );
}
