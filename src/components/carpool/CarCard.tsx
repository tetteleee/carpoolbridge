import type { PointerEvent as ReactPointerEvent } from 'react';
import { CarIcon } from '../icons';
import { LocationGroupedList } from './LocationGroupedList';
import { RouteLocationList } from './RouteLocationList';
import { toCarName } from '../../utils/carName';
import { computeOccupantCount, type CarCardData } from '../../utils/carCard';
import { Card } from '../common/Card';
import type { PersonCardData } from './PersonCard';

interface CarCardProps {
  car: CarCardData;
  /** ドラッグ中、この車カードがドロップ可能な対象として強調表示されるかどうか（T43） */
  isDropTarget?: boolean;
  /** ドラッグ中の人カードのID（自身のカード内であれば薄く表示するために使用。T43） */
  draggingPersonId?: string | null;
  /** 人カードのonPointerDownハンドラーを生成する（T43。長押しドラッグ開始の検知に使用） */
  onPersonPointerDown?: (
    person: PersonCardData
  ) => (event: ReactPointerEvent<Element>) => void;
}

/**
 * 配車画面（メイン）の車カード。
 * 乗車率・経由する集合場所を表示し、乗車人数（運転者を含む）が
 * 定員を超過している場合はカード枠を赤色で表示する。
 * ドラッグ＆ドロップ動作はT43で実施する。
 */
export function CarCard({
  car,
  isDropTarget = false,
  draggingPersonId = null,
  onPersonPointerDown,
}: CarCardProps) {
  const occupantCount = computeOccupantCount(car);
  const isOverCapacity = occupantCount > car.capacity;

  return (
    <Card
      as="section"
      data-drop-zone-id={car.id}
      style={{
        border: isOverCapacity
          ? '3.0px solid var(--negative-border)'
          : isDropTarget
            ? '2px dashed var(--drop-target-border)'
            : undefined,
        overflow: 'hidden',
        background: isDropTarget ? 'var(--drop-target-bg)' : undefined,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--text-h)',
            }}
          >
            <CarIcon size={18} />
            {toCarName(car.familyName)}
          </span>
          <RouteLocationList locationNames={car.routeLocationNames} />
          <span
            style={{
              flexShrink: 0,
              fontSize: '14px',
              fontWeight: 700,
              color: isOverCapacity ? 'var(--negative)' : 'var(--text-h)',
            }}
          >
            {occupantCount}/{car.capacity}
          </span>
        </div>
      </div>

      <div style={{ padding: '8px 10px' }}>
        <LocationGroupedList
          members={car.members}
          draggingPersonId={draggingPersonId}
          onPersonPointerDown={onPersonPointerDown}
          hideHeaderIfSingleGroup
        />
      </div>
    </Card>
  );
}
