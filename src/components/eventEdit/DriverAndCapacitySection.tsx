import type { CSSProperties } from 'react';
import { CarIcon } from '../icons';

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
  /** 車出し（行き・帰り）の変更。2値をまとめて渡す（片方だけの更新は行わない） */
  onChangeDriverOffer: (outward: boolean, ret: boolean) => void;
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
  background: 'var(--bg)',
  color: 'var(--text)',
  fontWeight: 400,
};

const dividerStyle: CSSProperties = {
  width: '1px',
  height: '28px',
  background: 'var(--border)',
  flexShrink: 0,
};

/** 「行きのみ／帰りのみ」用の縮小ボタン（○可・✕不可より一回り小さくし、1行に収まりやすくする） */
const exceptionButtonStyle: CSSProperties = {
  minHeight: '36px',
  padding: '0 8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '6px',
  fontSize: '12px',
  fontFamily: 'var(--sans)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
};

/** 折り返す場合に単位が崩れないよう、ボタン群をひとまとまりにするグループコンテナ */
const buttonGroupStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const unansweredDotStyle: CSSProperties = {
  display: 'inline-block',
  width: '8px',
  height: '8px',
  borderRadius: '999px',
  background: 'var(--warning)',
  flexShrink: 0,
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

/**
 * イベント編集（回答入力）画面・家庭カード内の
 * 車出し（行き／帰り）・乗車可能人数（capacityToday）の入力欄。
 * 車出しは「[○可][✕不可]」の1行に統合し、driverOutward・driverReturnをまとめて操作する。
 * [○可]が有効な間だけ、右側に区切り線を挟んで「行きのみ／帰りのみ」の例外ボタンを表示する（04_画面設計.md#7）。
 * 値は呼び出し側（FamilyResponseCard）が保持し、変更の都度Firestoreへ自動保存される（T29）。
 */
export function DriverAndCapacitySection({
  familyId,
  vehicleCapacity,
  driverOutward,
  driverReturn,
  capacityToday,
  onChangeDriverOffer,
  onChangeCapacityToday,
}: DriverAndCapacitySectionProps) {
  const isCapacityChanged = capacityToday !== null && capacityToday !== vehicleCapacity;
  const displayCapacity = capacityToday ?? vehicleCapacity;
  const capacityIsZero = displayCapacity <= 0;

  const anyYes = driverOutward === true || driverReturn === true;
  const bothNo = driverOutward === false && driverReturn === false;
  const outwardOnly = driverOutward === true && driverReturn === false;
  const returnOnly = driverOutward === false && driverReturn === true;

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <CarIcon size={16} />
        {driverOutward === null && driverReturn === null && (
          <span
            id={`driver-unanswered-dot-${familyId}`}
            aria-hidden="true"
            style={unansweredDotStyle}
          />
        )}
        <div style={buttonGroupStyle}>
          <button
            id={`driver-both-${familyId}-possible`}
            type="button"
            aria-pressed={anyYes}
            disabled={capacityIsZero}
            onClick={() => onChangeDriverOffer(true, true)}
            style={{
              ...choiceButtonBaseStyle,
              ...(anyYes ? choicePositiveSelectedStyle : choiceUnselectedStyle),
              opacity: capacityIsZero ? 0.4 : 1,
              cursor: capacityIsZero ? 'default' : 'pointer',
            }}
          >
            ○可
          </button>
          <button
            id={`driver-both-${familyId}-impossible`}
            type="button"
            aria-pressed={bothNo}
            onClick={() => onChangeDriverOffer(false, false)}
            style={{
              ...choiceButtonBaseStyle,
              ...(bothNo ? choiceNegativeSelectedStyle : choiceUnselectedStyle),
            }}
          >
            ✕不可
          </button>
        </div>

        {anyYes && (
          <div style={buttonGroupStyle}>
            <span aria-hidden="true" style={dividerStyle} />
            <button
              id={`driver-outward-only-${familyId}`}
              type="button"
              aria-pressed={outwardOnly}
              disabled={capacityIsZero}
              // 既に「行きのみ」が選択されていれば解除して両方○に戻す
              onClick={() => onChangeDriverOffer(true, outwardOnly)}
              style={{
                ...exceptionButtonStyle,
                ...(outwardOnly ? choicePositiveSelectedStyle : choiceUnselectedStyle),
                opacity: capacityIsZero ? 0.4 : 1,
                cursor: capacityIsZero ? 'default' : 'pointer',
              }}
            >
              行きのみ
            </button>
            <button
              id={`driver-return-only-${familyId}`}
              type="button"
              aria-pressed={returnOnly}
              disabled={capacityIsZero}
              // 既に「帰りのみ」が選択されていれば解除して両方○に戻す
              onClick={() => onChangeDriverOffer(returnOnly, true)}
              style={{
                ...exceptionButtonStyle,
                ...(returnOnly ? choicePositiveSelectedStyle : choiceUnselectedStyle),
                opacity: capacityIsZero ? 0.4 : 1,
                cursor: capacityIsZero ? 'default' : 'pointer',
              }}
            >
              帰りのみ
            </button>
          </div>
        )}
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
