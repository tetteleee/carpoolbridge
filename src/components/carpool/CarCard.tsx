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
  /**
   * 人カードの先頭アイコン（ドラッグハンドル）を表示しないかどうか。
   * LINE共有の共有用画像（静的な表示専用）で使用する（04_画面設計.md#9.2）。
   */
  hideLeadingIcon?: boolean;
  /**
   * 内側の余白を詰めた表示にするかどうか。
   * LINE共有の共有用画像で、複数の車カードが並んでも縦に長くなりすぎないようにするために使用する。
   */
  dense?: boolean;
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
  hideLeadingIcon = false,
  dense = false,
}: CarCardProps) {
  const occupantCount = computeOccupantCount(car);
  const isOverCapacity = occupantCount > car.capacity;

  return (
    // LINE共有の共有用画像はhtml2canvasでキャプチャするが、html2canvasはCard側のbox-shadowを
    // 描画できない（Canvas2Dのshadow*がclip()と併用されると反映されない制約による）。
    // そのためdense（共有用画像）の場合のみ、影の代わりに背景色を塗ったリングをCardの外側に
    // paddingとして敷き、実際の配車画面と同じ「影で境界を示す」見た目を疑似的に再現する。
    <div
      style={
        dense
          ? {
              borderRadius: '18px',
              background: 'rgba(0, 0, 0, 0.14)',
              padding: '1px 1px 4px',
            }
          : undefined
      }
    >
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
            padding: dense ? '7px 10px' : '10px 12px',
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

        <div style={{ padding: dense ? '6px 8px' : '8px 10px' }}>
          <LocationGroupedList
            members={car.members}
            draggingPersonId={draggingPersonId}
            onPersonPointerDown={onPersonPointerDown}
            hideHeaderIfSingleGroup
            hideLeadingIcon={hideLeadingIcon}
            dense={dense}
          />
        </div>
      </Card>
    </div>
  );
}
