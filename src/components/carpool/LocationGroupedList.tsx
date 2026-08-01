import { memo } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { PersonCard, type PersonCardData } from './PersonCard';
import { groupMembersByLocation } from '../../services/carpool/locationGrouping';
import { MapPinIcon } from '../icons';

interface LocationGroupedListProps {
  /** グルーピング対象の乗車メンバー一覧（未配車エリアの全件、または1台の車カードのmembers） */
  members: PersonCardData[];
  /** ドラッグ中の人カードのID（薄く表示するために使用） */
  draggingPersonId?: string | null;
  /**
   * 人カードのonPointerDownハンドラー（レンダリングを跨いで参照が変わらない）。
   * PersonCardへそのまま渡す（人物・sourceZoneIdはPersonCard側で付与する）。
   */
  onPersonPointerDown?: (
    event: ReactPointerEvent<Element>,
    person: PersonCardData,
    sourceZoneId: string
  ) => void;
  /** ドラッグ元のドロップゾーンID（未配車エリア、またはCarpool.id）。onPersonPointerDown指定時に使用する */
  sourceZoneId?: string;
  /**
   * 集合場所グループが1つしかない場合に見出しを省略するかどうか。
   * 車カードは既にヘッダー行（車名の横）に経由する集合場所を表示しているため、
   * グループが1つだけの場合は見出しが同じ情報の重複表示になる（CarCardから渡す）。
   * 未配車エリアには集合場所を表示する箇所が他にないため、常に見出しを表示する（省略時＝false）。
   */
  hideHeaderIfSingleGroup?: boolean;
  /**
   * 人カードの先頭アイコン（ドラッグハンドル）を表示しないかどうか。
   * LINE共有の共有用画像（静的な表示専用）で使用する（04_画面設計.md#9.2）。
   */
  hideLeadingIcon?: boolean;
  /**
   * グループ間・チップ間の余白を詰めるかどうか。
   * LINE共有の共有用画像で、縦に長くなりすぎないようにするために使用する。
   */
  dense?: boolean;
}

/**
 * 未配車エリア・車カードの乗車メンバー一覧を、集合場所（pickupLocationId）ごとに
 * グルーピングして表示する。1人のみのグループも同じ見出し＋チップ形式で表示する
 * （04_画面設計.md#8 集合場所グルーピング 参照）。
 * data-drop-zone-id はゾーンのルート要素（呼び出し元のCard）側に既に設定済みのため、
 * このコンポーネント内では設定しない。
 */
function LocationGroupedListComponent({
  members,
  draggingPersonId = null,
  onPersonPointerDown,
  sourceZoneId,
  hideHeaderIfSingleGroup = false,
  hideLeadingIcon = false,
  dense = false,
}: LocationGroupedListProps) {
  const groups = groupMembersByLocation(members);
  const showHeader = !(hideHeaderIfSingleGroup && groups.length <= 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: dense ? '6px' : '10px' }}>
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
                marginBottom: dense ? '3px' : '4px',
              }}
            >
              <MapPinIcon size={12} />
              {`${group.locationName}（${group.members.length}人）`}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: dense ? '6px' : '10px' }}>
            {group.members.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                compact
                hideLeadingIcon={hideLeadingIcon}
                onPointerDown={onPersonPointerDown}
                sourceZoneId={sourceZoneId}
                isDragging={person.id === draggingPersonId}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export const LocationGroupedList = memo(LocationGroupedListComponent);
