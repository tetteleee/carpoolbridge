import type { ComponentType, CSSProperties } from 'react';
import { CarIcon, CheckIcon, CloseIcon, ChevronLeftIcon, ChevronRightIcon } from '../icons';

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
  /** 車出し（行き・帰り）の変更。1回の選択でdriverOutward／driverReturnを同時に確定する */
  onChangeDriverOffer: (driverOutward: boolean, driverReturn: boolean) => void;
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
  padding: '0 12px',
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

/** 選択中のセグメントは白背景で浮き上がらせ、色は選択肢の意味（可＝positive等）で変える */
const segmentSelectedStyle: CSSProperties = {
  background: 'var(--bg)',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
  fontWeight: 700,
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

type DriverOfferKey = 'both' | 'none' | 'outwardOnly' | 'returnOnly';

interface DriverOfferOptionDef {
  key: DriverOfferKey;
  label: string;
  idSuffix: string;
  /** 選択時の文字色（可＝positive／不可＝negative／行きのみ・帰りのみ＝accent） */
  selectedColor: string;
  /** 選択時にラベルの前に表示するアイコン（未選択時はアイコンを表示しない） */
  SelectedIcon: ComponentType<{ size?: number }>;
  outward: boolean;
  return: boolean;
  /** 乗車可能人数0人の場合に選択不可にするか（＝いずれかの方向で運転が発生する選択肢か） */
  requiresCapacity: boolean;
}

const DRIVER_OFFER_OPTIONS: DriverOfferOptionDef[] = [
  {
    key: 'both',
    label: '可',
    idSuffix: 'both',
    selectedColor: 'var(--positive)',
    SelectedIcon: CheckIcon,
    outward: true,
    return: true,
    requiresCapacity: true,
  },
  {
    key: 'none',
    label: '不可',
    idSuffix: 'none',
    selectedColor: 'var(--negative)',
    SelectedIcon: CloseIcon,
    outward: false,
    return: false,
    requiresCapacity: false,
  },
  {
    key: 'outwardOnly',
    label: '行きのみ',
    idSuffix: 'outward-only',
    selectedColor: 'var(--accent)',
    SelectedIcon: ChevronRightIcon,
    outward: true,
    return: false,
    requiresCapacity: true,
  },
  {
    key: 'returnOnly',
    label: '帰りのみ',
    idSuffix: 'return-only',
    selectedColor: 'var(--accent)',
    SelectedIcon: ChevronLeftIcon,
    outward: false,
    return: true,
    requiresCapacity: true,
  },
];

/**
 * driverOutward／driverReturnの組み合わせを、画面上の4択（可／不可／行きのみ／帰りのみ）のキーに変換する。
 * 未回答（ともにnull）や、旧UIで独立して答えられた片方だけnullの組み合わせなど、
 * 4択のいずれにも一致しない場合はnull（未回答と同じ非選択表示）を返す。
 */
function resolveDriverOfferKey(
  driverOutward: boolean | null,
  driverReturn: boolean | null
): DriverOfferKey | null {
  const matched = DRIVER_OFFER_OPTIONS.find(
    (option) => option.outward === driverOutward && option.return === driverReturn
  );
  return matched?.key ?? null;
}

interface DriverOfferSegmentsProps {
  /** ボタン群のid付与に使用するid接頭辞 */
  idPrefix: string;
  driverOutward: boolean | null;
  driverReturn: boolean | null;
  onChange: (driverOutward: boolean, driverReturn: boolean) => void;
  /** 乗車可能人数0人のため、運転が発生する選択肢（可／行きのみ／帰りのみ）を選択不可にするか */
  capacityIsZero: boolean;
}

/**
 * 車出し「可／不可／行きのみ／帰りのみ」の4択（排他選択）ボタン。
 * driverOutward／driverReturnという独立した2項目を、画面上は1つの選択としてまとめて提示する
 * （04_画面設計.md#7参照）。乗車可能人数が0人の場合、[不可]以外は選択不可にする
 * （既に選択済みの場合は選択状態を維持したまま操作不可にする）。
 */
function DriverOfferSegments({
  idPrefix,
  driverOutward,
  driverReturn,
  onChange,
  capacityIsZero,
}: DriverOfferSegmentsProps) {
  const selectedKey = resolveDriverOfferKey(driverOutward, driverReturn);

  return (
    <div style={segmentTrackStyle}>
      {DRIVER_OFFER_OPTIONS.map((option) => {
        const selected = option.key === selectedKey;
        const disabled = option.requiresCapacity && capacityIsZero;
        const SelectedIcon = option.SelectedIcon;
        return (
          <button
            key={option.key}
            id={`${idPrefix}-${option.idSuffix}`}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(option.outward, option.return)}
            style={{
              ...segmentButtonBaseStyle,
              ...(selected ? { ...segmentSelectedStyle, color: option.selectedColor } : {}),
              opacity: disabled ? 0.4 : 1,
              cursor: disabled ? 'default' : 'pointer',
            }}
          >
            {selected && <SelectedIcon size={14} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * イベント編集（回答入力）画面・家庭カード内の
 * 車出し（可／不可／行きのみ／帰りのみ）・乗車可能人数（capacityToday）の入力欄。
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
        <span aria-label="車出し" role="img" style={{ display: 'flex', color: 'var(--text)' }}>
          <CarIcon size={18} />
        </span>
        <DriverOfferSegments
          idPrefix={`driver-offer-${familyId}`}
          driverOutward={driverOutward}
          driverReturn={driverReturn}
          onChange={onChangeDriverOffer}
          capacityIsZero={capacityIsZero}
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
