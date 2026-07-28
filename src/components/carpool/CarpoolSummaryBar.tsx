import { CarIcon, FlagIcon, MapPinIcon, UserIcon } from '../icons';
import { computeOccupantCount, type CarCardData } from './CarCard';
import { toCarName } from '../../utils/carName';

interface CarpoolSummaryBarProps {
  /** 選択中タブ（行き／帰り）の車カード一覧。表示順は渡された順のまま利用する */
  carCards: CarCardData[];
  /** 選択中タブ（行き／帰り）の未配車人数 */
  unassignedCount: number;
  /** 選択中タブ（行き／帰り）の配車不要人数 */
  noRideNeededCount: number;
}

const chipBaseStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  height: '24px',
  padding: '0 6px',
  borderRadius: '999px',
  fontSize: '11px',
  fontWeight: 700,
  whiteSpace: 'nowrap',
} as const;

/**
 * 配車画面（メイン）のサマリー帯。
 * 未配車人数・各車の乗車率／経由地数をチップで表示し、車の台数が多い場合でも
 * 横スクロールはさせず折り返し表示にすることで、一目で全体を見渡せるようにする。
 * ヘッダー・行き／帰りタブと一体でsticky表示されることを前提に、帯自体の背景は
 * 本文と同じ色とし、チップにのみ薄い背景色をつけて視認性を確保する（浮いて見えないように）。
 */
export function CarpoolSummaryBar({ carCards, unassignedCount, noRideNeededCount }: CarpoolSummaryBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '4px',
        padding: '8px 12px',
        background: 'var(--bg)',
        boxSizing: 'border-box',
      }}
    >
      {unassignedCount > 0 && (
        <span
          style={{
            ...chipBaseStyle,
            gap: '3px',
            background: 'var(--panel-bg)',
            border: '1px solid var(--border)',
            color: 'var(--text-h)',
          }}
        >
          <UserIcon size={12} />
          {unassignedCount}
        </span>
      )}

      {carCards.map((car) => {
        const occupantCount = computeOccupantCount(car);
        const isOverCapacity = occupantCount > car.capacity;
        const isFull = !isOverCapacity && occupantCount === car.capacity;
        const accentColor = isOverCapacity
          ? 'var(--negative)'
          : isFull
            ? 'var(--accent)'
            : 'var(--positive)';

        return (
          <span
            key={car.id}
            style={{
              ...chipBaseStyle,
              gap: '3px',
              padding: '0 6px 0 5px',
              background: isOverCapacity ? 'var(--negative-bg)' : 'var(--panel-bg)',
              border: `1px solid ${isOverCapacity ? 'var(--negative-border)' : 'var(--border)'}`,
              color: isOverCapacity ? 'var(--negative)' : 'var(--text-h)',
            }}
          >
            <CarIcon size={10} />
            <span
              style={{
                padding: '0 4px',
                borderLeft: `3px solid ${accentColor}`,
                lineHeight: 1,
                color: 'var(--text-h)',
              }}
            >
              {toCarName(car.familyName)}
            </span>
            <span>
              {occupantCount}/{car.capacity}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '1px',
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--text)',
              }}
            >
              <MapPinIcon size={9} />
              {car.routeLocationNames.length}
            </span>
          </span>
        );
      })}

      {noRideNeededCount > 0 && (
        <span
          style={{
            ...chipBaseStyle,
            gap: '3px',
            fontWeight: 600,
            background: 'var(--panel-bg)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        >
          <FlagIcon size={12} />
          {noRideNeededCount}
        </span>
      )}
    </div>
  );
}
