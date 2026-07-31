import type { PointerEvent as ReactPointerEvent } from 'react';
import type { PersonCardData } from './PersonCard';
import { LocationGroupedList } from './LocationGroupedList';
import { UNASSIGNED_ZONE_ID } from '../../services/carpool/carpoolMember';
import { Card } from '../common/Card';

/** 未配車エリアに表示する人カード1件分のデータ */
export type UnassignedPerson = PersonCardData;

interface UnassignedAreaProps {
  /** 選択中タブ（行き／帰り）に応じた未配車の人一覧 */
  people: UnassignedPerson[];
  /** ドラッグ中、このエリアがドロップ可能な対象として強調表示されるかどうか（T43） */
  isDropTarget?: boolean;
  /** ドラッグ中の人カードのID（自身のエリア内であれば薄く表示するために使用。T43） */
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
   * LINE共有の共有用画像で、縦に長くなりすぎないようにするために使用する。
   */
  dense?: boolean;
}

/**
 * 配車画面（メイン）の未配車エリア。
 * 未配車人数が0人の場合はエリア自体を非表示にする。
 */
export function UnassignedArea({
  people,
  isDropTarget = false,
  draggingPersonId = null,
  onPersonPointerDown,
  hideLeadingIcon = false,
  dense = false,
}: UnassignedAreaProps) {
  if (people.length === 0) {
    return null;
  }

  return (
    <Card
      as="section"
      data-drop-zone-id={UNASSIGNED_ZONE_ID}
      style={{
        border: isDropTarget ? '2px dashed var(--drop-target-border)' : undefined,
        overflow: 'hidden',
        background: isDropTarget ? 'var(--drop-target-bg)' : undefined,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <h2
        style={{
          margin: 0,
          padding: dense ? '7px 10px' : '10px 12px',
          fontSize: '14px',
          fontWeight: 700,
          color: 'var(--text-h)',
          borderBottom: '1px dashed var(--border)',
        }}
      >
        {'未配車　' + people.length + '名'}
      </h2>

      <div style={{ padding: dense ? '7px 10px' : '10px 12px' }}>
        <LocationGroupedList
          members={people}
          draggingPersonId={draggingPersonId}
          onPersonPointerDown={onPersonPointerDown}
          hideLeadingIcon={hideLeadingIcon}
          dense={dense}
        />
      </div>
    </Card>
  );
}
