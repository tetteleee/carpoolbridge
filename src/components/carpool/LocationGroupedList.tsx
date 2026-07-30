import type { PointerEvent as ReactPointerEvent } from 'react';
import { PersonCard, type PersonCardData } from './PersonCard';
import { groupMembersByLocation } from '../../services/carpool/locationGrouping';
import { MapPinIcon } from '../icons';

interface LocationGroupedListProps {
  /** グルーピング対象の乗車メンバー一覧（未配車エリアの全件、または1台の車カードのmembers） */
  members: PersonCardData[];
  /** ドラッグ中の人カードのID（薄く表示するために使用） */
  draggingPersonId?: string | null;
  /** 人カードのonPointerDownハンドラーを生成する */
  onPersonPointerDown?: (
    person: PersonCardData
  ) => (event: ReactPointerEvent<Element>) => void;
  /**
   * 集合場所グループが1つしかない場合に見出しを省略するかどうか。
   * 車カードは既にヘッダー行（車名の横）に経由する集合場所を表示しているため、
   * グループが1つだけの場合は見出しが同じ情報の重複表示になる（CarCardから渡す）。
   * 未配車エリアには集合場所を表示する箇所が他にないため、常に見出しを表示する（省略時＝false）。
   */
  hideHeaderIfSingleGroup?: boolean;
}

/**
 * 未配車エリア・車カードの乗車メンバー一覧を、集合場所（pickupLocationId）ごとに
 * グルーピングして表示する。1人のみのグループも同じ見出し＋チップ形式で表示する
 * （04_画面設計.md#8 集合場所グルーピング 参照）。
 * data-drop-zone-id はゾーンのルート要素（呼び出し元のCard）側に既に設定済みのため、
 * このコンポーネント内では設定しない。
 */
export function LocationGroupedList({
  members,
  draggingPersonId = null,
  onPersonPointerDown,
  hideHeaderIfSingleGroup = false,
}: LocationGroupedListProps) {
  const groups = groupMembersByLocation(members);
  const showHeader = !(hideHeaderIfSingleGroup && groups.length <= 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {groups.map((group) => (
        <div key={group.locationId}>
          {showHeader && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: '4px',
              }}
            >
              <MapPinIcon size={12} />
              {`${group.locationName}（${group.members.length}人）`}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {group.members.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                compact
                onPointerDown={onPersonPointerDown?.(person)}
                isDragging={person.id === draggingPersonId}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
