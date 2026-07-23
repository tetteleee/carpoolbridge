import type { CSSProperties } from 'react';

interface DriverAndCapacitySectionProps {
  /** 対象家庭ID（DOM要素のid付与に使用） */
  familyId: string;
  /** 家庭の通常定員（Family.vehicleCapacity）。乗車可能人数未変更時のプレースホルダーに使用 */
  vehicleCapacity: number;
  /** 行き車出し可否。未選択（未回答）はnull */
  driverOutward: boolean | null;
  /** 帰り車出し可否。未選択（未回答）はnull */
  driverReturn: boolean | null;
  /** 当日乗車可能人数の上書き。未変更はnull */
  capacityToday: number | null;
  /** 行き車出し可否の変更 */
  onChangeDriverOutward: (value: boolean) => void;
  /** 帰り車出し可否の変更 */
  onChangeDriverReturn: (value: boolean) => void;
  /** 当日乗車可能人数の変更 */
  onChangeCapacityToday: (value: number) => void;
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

const stepperButtonStyle: CSSProperties = {
  minWidth: '44px',
  minHeight: '44px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '6px',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text)',
  fontSize: '16px',
  fontFamily: 'var(--sans)',
  cursor: 'pointer',
};

interface DriverChoiceButtonsProps {
  /** ボタン群のid付与に使用するid接頭辞 */
  idPrefix: string;
  /** 現在の選択値。未選択はnull */
  value: boolean | null;
  onChange: (value: boolean) => void;
  /** 乗車可能人数0人のため[可]を選択不可にするか */
  possibleDisabled: boolean;
}

/**
 * 車出し可否の[可][不可]2択ボタン。
 * 乗車可能人数が0人の場合、[可]は選択不可にする（既に選択済みの場合は選択状態を維持したまま操作不可にする）。
 */
function DriverChoiceButtons({ idPrefix, value, onChange, possibleDisabled }: DriverChoiceButtonsProps) {
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <button
        id={`${idPrefix}-possible`}
        type="button"
        aria-pressed={value === true}
        disabled={possibleDisabled}
        onClick={() => onChange(true)}
        style={{
          ...choiceButtonBaseStyle,
          ...(value === true ? choicePositiveSelectedStyle : choiceUnselectedStyle),
          opacity: possibleDisabled ? 0.4 : 1,
          cursor: possibleDisabled ? 'default' : 'pointer',
        }}
      >
        ○可
      </button>
      <button
        id={`${idPrefix}-impossible`}
        type="button"
        aria-pressed={value === false}
        onClick={() => onChange(false)}
        style={{
          ...choiceButtonBaseStyle,
          ...(value === false ? choiceNegativeSelectedStyle : choiceUnselectedStyle),
        }}
      >
        ✕不可
      </button>
    </div>
  );
}

/**
 * イベント編集（回答入力）画面・家庭カード内の
 * 車出し（行き／帰り）・乗車可能人数（capacityToday）の入力欄。
 * 値は呼び出し側（FamilyResponseCard）が保持し、変更の都度Firestoreへ自動保存される（T29）。
 */
export function DriverAndCapacitySection({
  familyId,
  vehicleCapacity,
  driverOutward,
  driverReturn,
  capacityToday,
  onChangeDriverOutward,
  onChangeDriverReturn,
  onChangeCapacityToday,
}: DriverAndCapacitySectionProps) {
  const isCapacityChanged = capacityToday !== null && capacityToday !== vehicleCapacity;
  const displayCapacity = capacityToday ?? vehicleCapacity;
  const capacityIsZero = displayCapacity <= 0;

  const handleDecrement = () => {
    onChangeCapacityToday(Math.max(0, displayCapacity - 1));
  };

  const handleIncrement = () => {
    onChangeCapacityToday(displayCapacity + 1);
  };

  return (
    <div
      id={`drive-offer-frame-${familyId}`}
      style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
    >
      <div style={rowStyle}>
        <span style={rowLabelStyle}>車出し（行き）</span>
        <DriverChoiceButtons
          idPrefix={`driver-outward-${familyId}`}
          value={driverOutward}
          onChange={onChangeDriverOutward}
          possibleDisabled={capacityIsZero}
        />
      </div>

      <div style={rowStyle}>
        <span style={rowLabelStyle}>車出し（帰り）</span>
        <DriverChoiceButtons
          idPrefix={`driver-return-${familyId}`}
          value={driverReturn}
          onChange={onChangeDriverReturn}
          possibleDisabled={capacityIsZero}
        />
      </div>

      <div style={rowStyle}>
        <span style={rowLabelStyle}>乗車可能人数</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isCapacityChanged && (
            <span
              id={`capacity-changed-label-${familyId}`}
              style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              変更済み
            </span>
          )}
          <button
            id={`capacity-today-decrement-${familyId}`}
            type="button"
            aria-label="乗車可能人数を減らす"
            disabled={displayCapacity <= 0}
            onClick={handleDecrement}
            style={{
              ...stepperButtonStyle,
              opacity: displayCapacity <= 0 ? 0.4 : 1,
              cursor: displayCapacity <= 0 ? 'default' : 'pointer',
            }}
          >
            －
          </button>
          <span
            id={`capacity-today-value-${familyId}`}
            style={{
              minWidth: '24px',
              textAlign: 'center',
              fontSize: '14px',
              fontFamily: 'var(--sans)',
              color: isCapacityChanged ? 'var(--text-h)' : 'var(--text)',
              fontWeight: isCapacityChanged ? 700 : 400,
            }}
          >
            {displayCapacity}
          </span>
          <button
            id={`capacity-today-increment-${familyId}`}
            type="button"
            aria-label="乗車可能人数を増やす"
            onClick={handleIncrement}
            style={stepperButtonStyle}
          >
            ＋
          </button>
          <span style={rowLabelStyle}>人</span>
        </div>
      </div>
    </div>
  );
}
