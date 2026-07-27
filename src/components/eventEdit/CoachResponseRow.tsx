import type { CSSProperties } from 'react';

interface CoachResponseRowProps {
  /** 対象家庭ID（DOM要素のid付与に使用） */
  familyId: string;
  /** コーチが参加するかどうか。未選択=null */
  coachParticipating: boolean | null;
  /** 参加有無の変更 */
  onChange: (value: boolean) => void;
}

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
  background: 'var(--bg)',
  color: 'var(--text)',
  fontWeight: 400,
};

const unansweredDotStyle: CSSProperties = {
  display: 'inline-block',
  width: '8px',
  height: '8px',
  borderRadius: '999px',
  background: 'var(--warning)',
  flexShrink: 0,
};

/** 折り返す場合に単位が崩れないよう、ボタン群をひとまとまりにするグループコンテナ */
const buttonGroupStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

/**
 * イベント編集（回答入力）画面・家庭カード内の
 * コーチの参加（3状態）ボタン。呼び出し側（FamilyResponseCard）で
 * Family.coachNameが設定されている家庭のみ表示する。
 * 子供カード（ChildResponseRow）と同じ見た目に揃え、「参加」ラベルは表示せず
 * ボタンのみを1行で表示する。未回答（未選択）の場合はボタン脇にドットを表示する。
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
      style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}
    >
      {coachParticipating === null && (
        <span
          id={`coach-participating-unanswered-dot-${familyId}`}
          aria-hidden="true"
          style={unansweredDotStyle}
        />
      )}
      <div style={buttonGroupStyle}>
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
  );
}
