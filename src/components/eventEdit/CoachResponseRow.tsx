import { useState, type CSSProperties } from 'react';

interface CoachResponseRowProps {
  /** 対象家庭ID（DOM要素のid付与に使用） */
  familyId: string;
  /** 初期表示に用いる既存回答のcoachParticipating（対象家庭が未回答の場合はundefined） */
  initialCoachParticipating: boolean | null | undefined;
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
  minWidth: '44px',
  minHeight: '44px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '6px',
  fontSize: '13px',
  fontFamily: 'var(--sans)',
  cursor: 'pointer',
};

const choiceSelectedStyle: CSSProperties = {
  border: '1px solid var(--accent-border)',
  background: 'var(--accent-bg)',
  color: 'var(--accent)',
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
 * 既存回答（Response.coachParticipating）が存在する場合は、その値を初期値として反映する。
 * 存在しない場合（未回答）はcoachParticipating=nullとする。
 * ここでの状態は画面内のみで保持し、Firestoreへの保存はT29で実装する。
 */
export function CoachResponseRow({
  familyId,
  initialCoachParticipating,
}: CoachResponseRowProps) {
  const [coachParticipating, setCoachParticipating] = useState<
    boolean | null
  >(initialCoachParticipating ?? null);

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
            onClick={() => setCoachParticipating(true)}
            style={{
              ...choiceButtonBaseStyle,
              ...(coachParticipating === true
                ? choiceSelectedStyle
                : choiceUnselectedStyle),
            }}
          >
            ○
          </button>
          <button
            id={`coach-participating-no-${familyId}`}
            type="button"
            aria-pressed={coachParticipating === false}
            onClick={() => setCoachParticipating(false)}
            style={{
              ...choiceButtonBaseStyle,
              ...(coachParticipating === false
                ? choiceSelectedStyle
                : choiceUnselectedStyle),
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
