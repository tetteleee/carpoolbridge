import { useState, type CSSProperties } from 'react';
import type { ResponseChild } from '../../types/event';

interface ChildResponseRowProps {
  /** 対象子供ID（DOM要素のid付与に使用） */
  childId: string;
  /** 初期表示に用いる既存回答（対象子供が未回答の場合はundefined） */
  initialResponseChild: ResponseChild | undefined;
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
 * 既存回答（Response.children[]）に対象childIdが存在する場合は、その値を初期値として反映する。
 * 存在しない場合（未回答）はisParticipating=null・noOutwardRide=false・noReturnRide=falseとする。
 * ここでの状態は画面内のみで保持し、Firestoreへの保存はT29で実装する。
 */
export function ChildResponseRow({
  childId,
  initialResponseChild,
}: ChildResponseRowProps) {
  const [isParticipating, setIsParticipating] = useState<boolean | null>(
    initialResponseChild?.isParticipating ?? null
  );
  const [noOutwardRide, setNoOutwardRide] = useState<boolean>(
    initialResponseChild?.noOutwardRide ?? false
  );
  const [noReturnRide, setNoReturnRide] = useState<boolean>(
    initialResponseChild?.noReturnRide ?? false
  );

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
            onClick={() => setIsParticipating(true)}
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
            onClick={() => setIsParticipating(false)}
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
          onChange={(e) => setNoOutwardRide(e.target.checked)}
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
          onChange={(e) => setNoReturnRide(e.target.checked)}
        />
        帰りの配車不要
      </label>
    </div>
  );
}
