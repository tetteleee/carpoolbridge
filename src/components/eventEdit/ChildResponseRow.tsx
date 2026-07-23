import type { CSSProperties } from 'react';

interface ChildResponseRowProps {
  /** 対象子供ID（DOM要素のid付与に使用） */
  childId: string;
  /** イベントに参加するかどうか。未選択=null */
  isParticipating: boolean | null;
  /** 行きの配車が不要かどうか */
  noOutwardRide: boolean;
  /** 帰りの配車が不要かどうか */
  noReturnRide: boolean;
  /** 参加有無の変更 */
  onChangeIsParticipating: (value: boolean) => void;
  /** 行きの配車不要チェックの変更 */
  onChangeNoOutwardRide: (value: boolean) => void;
  /** 帰りの配車不要チェックの変更 */
  onChangeNoReturnRide: (value: boolean) => void;
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

const checkboxRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '13px',
  color: 'var(--text)',
};

const checkboxRowDisabledStyle: CSSProperties = {
  ...checkboxRowStyle,
  opacity: 0.5,
};

/**
 * イベント編集（回答入力）画面・家庭カード内の
 * 子供ごとの参加（3状態）・行き／帰りの配車不要チェックボックス。
 * 値は呼び出し側（FamilyResponseCard）が保持し、変更の都度Firestoreへ自動保存される（T29）。
 */
export function ChildResponseRow({
  childId,
  isParticipating,
  noOutwardRide,
  noReturnRide,
  onChangeIsParticipating,
  onChangeNoOutwardRide,
  onChangeNoReturnRide,
}: ChildResponseRowProps) {
  // 配車不要チェックは「参加」が○（true）の場合のみ意味を持つため、
  // ○以外（✕・未回答）では操作不可にする。値自体は保持し、○に戻せば復元される。
  const rideCheckboxDisabled = isParticipating !== true;

  return (
    <div
      id={`child-response-frame-${childId}`}
      style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
    >
      <div style={rowStyle}>
        <span style={rowLabelStyle}>参加</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            id={`child-participating-yes-${childId}`}
            type="button"
            aria-pressed={isParticipating === true}
            onClick={() => onChangeIsParticipating(true)}
            style={{
              ...choiceButtonBaseStyle,
              ...(isParticipating === true
                ? choicePositiveSelectedStyle
                : choiceUnselectedStyle),
            }}
          >
            ○参加
          </button>
          <button
            id={`child-participating-no-${childId}`}
            type="button"
            aria-pressed={isParticipating === false}
            onClick={() => onChangeIsParticipating(false)}
            style={{
              ...choiceButtonBaseStyle,
              ...(isParticipating === false
                ? choiceNegativeSelectedStyle
                : choiceUnselectedStyle),
            }}
          >
            ✕不参加
          </button>
        </div>
      </div>

      <label
        style={rideCheckboxDisabled ? checkboxRowDisabledStyle : checkboxRowStyle}
        htmlFor={`no-outward-ride-${childId}`}
      >
        <input
          id={`no-outward-ride-${childId}`}
          type="checkbox"
          checked={noOutwardRide}
          disabled={rideCheckboxDisabled}
          onChange={(e) => onChangeNoOutwardRide(e.target.checked)}
        />
        行きの配車不要
      </label>

      <label
        style={rideCheckboxDisabled ? checkboxRowDisabledStyle : checkboxRowStyle}
        htmlFor={`no-return-ride-${childId}`}
      >
        <input
          id={`no-return-ride-${childId}`}
          type="checkbox"
          checked={noReturnRide}
          disabled={rideCheckboxDisabled}
          onChange={(e) => onChangeNoReturnRide(e.target.checked)}
        />
        帰りの配車不要
      </label>
    </div>
  );
}
