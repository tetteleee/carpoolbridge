import { useState, type CSSProperties } from 'react';
import type { Response } from '../../types/event';
import { PencilIcon } from '../icons';

interface DriverAndCapacitySectionProps {
  /** 対象家庭ID（DOM要素のid付与に使用） */
  familyId: string;
  /** 家庭の通常定員（Family.vehicleCapacity）。乗車可能人数未変更時のプレースホルダーに使用 */
  vehicleCapacity: number;
  /** 初期表示に用いる既存回答（対象家庭が未回答の場合はundefined） */
  initialResponse: Response | undefined;
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
}

/**
 * 車出し可否の[可][不可]2択ボタン。
 */
function DriverChoiceButtons({ idPrefix, value, onChange }: DriverChoiceButtonsProps) {
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <button
        id={`${idPrefix}-possible`}
        type="button"
        aria-pressed={value === true}
        onClick={() => onChange(true)}
        style={{
          ...choiceButtonBaseStyle,
          ...(value === true ? choiceSelectedStyle : choiceUnselectedStyle),
        }}
      >
        ○
      </button>
      <button
        id={`${idPrefix}-impossible`}
        type="button"
        aria-pressed={value === false}
        onClick={() => onChange(false)}
        style={{
          ...choiceButtonBaseStyle,
          ...(value === false ? choiceSelectedStyle : choiceUnselectedStyle),
        }}
      >
        ✕
      </button>
    </div>
  );
}

/**
 * イベント編集（回答入力）画面・家庭カード内の
 * 車出し（行き／帰り）・乗車可能人数（capacityToday）の入力欄。
 * 既存回答（Response）が存在する場合は、その値を初期値として反映する。
 * ここでの状態は画面内のみで保持し、Firestoreへの保存はT29で実装する。
 */
export function DriverAndCapacitySection({
  familyId,
  vehicleCapacity,
  initialResponse,
}: DriverAndCapacitySectionProps) {
  const [driverOutward, setDriverOutward] = useState<boolean | null>(
    initialResponse?.driverOutward ?? null
  );
  const [driverReturn, setDriverReturn] = useState<boolean | null>(
    initialResponse?.driverReturn ?? null
  );
  const [capacityToday, setCapacityToday] = useState<number | null>(
    initialResponse?.capacityToday ?? null
  );

  const isCapacityChanged = capacityToday !== null;
  const displayCapacity = capacityToday ?? vehicleCapacity;

  const handleDecrement = () => {
    setCapacityToday(Math.max(0, displayCapacity - 1));
  };

  const handleIncrement = () => {
    setCapacityToday(displayCapacity + 1);
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
          onChange={setDriverOutward}
        />
      </div>

      <div style={rowStyle}>
        <span style={rowLabelStyle}>車出し（帰り）</span>
        <DriverChoiceButtons
          idPrefix={`driver-return-${familyId}`}
          value={driverReturn}
          onChange={setDriverReturn}
        />
      </div>

      <div style={rowStyle}>
        <span style={rowLabelStyle}>乗車可能人数</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isCapacityChanged && (
            <span
              id={`capacity-changed-icon-${familyId}`}
              style={{ color: 'var(--accent)', display: 'flex' }}
              title="変更済み"
            >
              <PencilIcon size={14} />
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
