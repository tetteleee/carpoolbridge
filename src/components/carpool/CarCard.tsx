import type { PointerEvent as ReactPointerEvent } from 'react';
import { CarIcon, MapPinIcon } from '../icons';
import { PersonCard, type PersonCardData } from './PersonCard';
import { memberKey } from '../../services/carpool/carpoolMember';

/**
 * 車カード1台分のデータ。
 * 車カードデータの取得・算出処理自体は対象設計書に取得元の規定がないため対象外とし、
 * このデータは呼び出し元から渡される前提とする。
 */
export interface CarCardData {
  /** 配車ID */
  id: string;
  /** 家庭名（例：「山田家」）。カード上は「家」を除き「号」を付与した車名として表示する */
  familyName: string;
  /** 運転者本人を含む総定員 */
  capacity: number;
  /** 経由する集合場所名の一覧（表示順は巡回順を意味しない。実際の順番は当日ドライバーが判断する） */
  routeLocationNames: string[];
  /** 乗車メンバー（運転者は含めない） */
  members: PersonCardData[];
}

interface CarCardProps {
  car: CarCardData;
  /** ドラッグ中、この車カードがドロップ可能な対象として強調表示されるかどうか（T43） */
  isDropTarget?: boolean;
  /** ドラッグ中の人カードのID（自身のカード内であれば薄く表示するために使用。T43） */
  draggingPersonId?: string | null;
  /** ドラッグ中、この車カード内で挿入先となる直前の乗車メンバーのキー（memberKey形式）。末尾に挿入される場合はnull。isDropTargetがfalseの間は意味を持たない */
  insertionAnchorKey?: string | null;
  /** 人カードのonPointerDownハンドラーを生成する（T43。長押しドラッグ開始の検知に使用） */
  onPersonPointerDown?: (
    person: PersonCardData
  ) => (event: ReactPointerEvent<Element>) => void;
}

/**
 * 家庭名から車名を算出する（例：山田家→山田号）。
 */
function toCarName(familyName: string): string {
  return `${familyName.replace(/家$/, '')}号`;
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
  insertionAnchorKey = null,
  onPersonPointerDown,
}: CarCardProps) {
  const occupantCount = car.members.length + 1;
  const isOverCapacity = occupantCount > car.capacity;

  return (
    <section
      data-drop-zone-id={car.id}
      style={{
        border: isOverCapacity
          ? '3.0px solid var(--negative-border)'
          : isDropTarget
            ? '2px dashed var(--drop-target-border)'
            : '1px solid var(--border)',
        borderRadius: '8px',
        overflow: 'hidden',
        background: isDropTarget ? 'var(--drop-target-bg)' : undefined,
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
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--text-h)',
            }}
          >
            <CarIcon size={18} />
            {toCarName(car.familyName)}
          </span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: isOverCapacity ? 'var(--negative)' : 'var(--text-h)',
            }}
          >
            {occupantCount}/{car.capacity}
          </span>
        </div>

        <div
          style={{
            marginTop: '4px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '4px 10px',
            fontSize: '12px',
            color: 'var(--text)',
          }}
        >
          {car.routeLocationNames.map((locationName, index) => (
            <span
              key={index}
              style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
            >
              <MapPinIcon size={12} />
              {locationName}
            </span>
          ))}
        </div>
      </div>

      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {car.members.map((member, index) => {
          const personKey = memberKey(member.member);
          const isInsertionAnchor = isDropTarget && insertionAnchorKey === personKey;
          const isAppendTarget =
            isDropTarget && insertionAnchorKey === null && index === car.members.length - 1;
          return (
            <li
              key={member.id}
              data-person-key={personKey}
              style={{
                borderTop: isInsertionAnchor
                  ? '3px solid var(--drop-target-border)'
                  : '1px solid var(--border)',
                borderBottom: isAppendTarget ? '3px solid var(--drop-target-border)' : undefined,
              }}
            >
              <PersonCard
                person={member}
                onPointerDown={onPersonPointerDown?.(member)}
                isDragging={member.id === draggingPersonId}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
