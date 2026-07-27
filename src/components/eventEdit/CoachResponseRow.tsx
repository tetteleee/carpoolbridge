import type { CSSProperties } from 'react';
import { CheckIcon, CloseIcon } from '../icons';

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
  gap: '8px',
};

/** iOSセグメントコントロール風の外枠（トラック）。中に選択肢のピルボタンを並べる */
const segmentTrackStyle: CSSProperties = {
  display: 'inline-flex',
  background: 'var(--border)',
  borderRadius: '12px',
  padding: '3px',
  gap: '2px',
};

/** セグメントコントロール内の各選択肢ボタン（未選択時は枠なし・透明） */
const segmentButtonBaseStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  minHeight: '38px',
  padding: '0 10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  borderRadius: '9px',
  fontSize: '13px',
  fontFamily: 'var(--sans)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  color: 'var(--text)',
  fontWeight: 400,
};

/** 選択中のセグメントは白背景で浮き上がらせ、色は選択肢の意味（参加＝positive等）で変える */
const segmentSelectedStyle: CSSProperties = {
  background: 'var(--bg)',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
  fontWeight: 700,
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
        <div style={segmentTrackStyle}>
          <button
            id={`coach-participating-yes-${familyId}`}
            type="button"
            aria-pressed={coachParticipating === true}
            onClick={() => onChange(true)}
            style={{
              ...segmentButtonBaseStyle,
              ...(coachParticipating === true
                ? { ...segmentSelectedStyle, color: 'var(--positive)' }
                : {}),
            }}
          >
            {coachParticipating === true && <CheckIcon size={14} />}
            参加
          </button>
          <button
            id={`coach-participating-no-${familyId}`}
            type="button"
            aria-pressed={coachParticipating === false}
            onClick={() => onChange(false)}
            style={{
              ...segmentButtonBaseStyle,
              ...(coachParticipating === false
                ? { ...segmentSelectedStyle, color: 'var(--negative)' }
                : {}),
            }}
          >
            {coachParticipating === false && <CloseIcon size={14} />}
            不参加
          </button>
        </div>
      </div>
    </div>
  );
}
