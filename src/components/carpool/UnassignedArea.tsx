import { memo } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { PersonCardData } from './PersonCard';
import { LocationGroupedList } from './LocationGroupedList';
import { UNASSIGNED_ZONE_ID } from '../../services/carpool/carpoolMember';
import { Card } from '../common/Card';
import { getCaptureShadowRingStyle } from '../../utils/captureShadowRing';

/** 未配車エリアに表示する人カード1件分のデータ */
export type UnassignedPerson = PersonCardData;

interface UnassignedAreaProps {
  /** 選択中タブ（行き／帰り）に応じた未配車の人一覧 */
  people: UnassignedPerson[];
  /** ドラッグ中、このエリアがドロップ可能な対象として強調表示されるかどうか（T43） */
  isDropTarget?: boolean;
  /** ドラッグ中の人カードのID（自身のエリア内であれば薄く表示するために使用。T43） */
  draggingPersonId?: string | null;
  /**
   * 人カードのonPointerDownハンドラー（T43。長押しドラッグ開始の検知に使用）。
   * レンダリングを跨いで参照が変わらないため、そのままLocationGroupedListへ渡す。
   */
  onPersonPointerDown?: (
    event: ReactPointerEvent<Element>,
    person: PersonCardData,
    sourceZoneId: string
  ) => void;
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
  /**
   * 未配車が0人のときにエリア自体を非表示にするかどうか。
   * LINE共有の共有用画像（静的な表示専用）では、ドラッグで人を戻す受け皿が不要なため
   * trueを指定し、従来どおり0人時は非表示にする。
   * 配車画面（メイン）では既定のfalseのまま使い、見出し1行の帯を残す（下記コメント参照）。
   */
  hideWhenEmpty?: boolean;
}

/**
 * 配車画面（メイン）の未配車エリア。
 * 未配車人数が0人になっても見出し1行の帯は残し、配車調整中に車カードから
 * 人を未配車へ戻すドロップ先として機能させる（本文の人カード一覧は0人のときは表示しない）。
 */
function UnassignedAreaComponent({
  people,
  isDropTarget = false,
  draggingPersonId = null,
  onPersonPointerDown,
  hideLeadingIcon = false,
  dense = false,
  hideWhenEmpty = false,
}: UnassignedAreaProps) {
  const isEmpty = people.length === 0;

  if (isEmpty && hideWhenEmpty) {
    return null;
  }

  return (
    <div style={getCaptureShadowRingStyle(dense)}>
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
            borderBottom: isEmpty ? undefined : '1px dashed var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <span>{'未配車　' + people.length + '名'}</span>
          {isEmpty && (
            <span style={{ fontWeight: 400, fontSize: '12px', color: 'var(--text)', opacity: 0.65 }}>
              ここにドラッグで人を戻せます
            </span>
          )}
        </h2>

        {!isEmpty && (
          <div style={{ padding: dense ? '7px 10px' : '10px 12px' }}>
            <LocationGroupedList
              members={people}
              draggingPersonId={draggingPersonId}
              onPersonPointerDown={onPersonPointerDown}
              sourceZoneId={UNASSIGNED_ZONE_ID}
              hideLeadingIcon={hideLeadingIcon}
              dense={dense}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

export const UnassignedArea = memo(UnassignedAreaComponent);
