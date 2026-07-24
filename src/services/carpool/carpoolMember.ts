/**
 * 配車画面（メイン）における乗車メンバーの識別・移動処理
 * ref: docs/04_画面設計.md#8 ドラッグ＆ドロップ, docs/05_データ設計.md#9 Carpool（配車結果）
 */

import type { Carpool, CarpoolMember } from '../../types/event';
import { updateCarpool } from '../event/carpoolService';

/** 未配車エリアを表すドロップゾーンID（車カードはCarpool.idをそのままドロップゾーンIDとして使う） */
export const UNASSIGNED_ZONE_ID = 'unassigned';

/** 乗車メンバー（child/coach）を一意に識別するキーを生成する */
export function memberKey(member: CarpoolMember): string {
  return member.type === 'child' ? `child:${member.childId}` : `coach:${member.familyId}`;
}

/** 2つの乗車メンバー配列が、並び順を含めて完全に一致するかどうかを判定する */
function sameOrder(a: CarpoolMember[], b: CarpoolMember[]): boolean {
  return a.length === b.length && a.every((m, index) => memberKey(m) === memberKey(b[index]));
}

/**
 * 未配車エリア⇔車カード間、車カード⇔車カード間、または同一車カード内で乗車メンバー1人を
 * 移動・並び替えし、T20のCarpool読み書き処理を通じて配車結果データへ反映する。
 * 挿入位置は`targetAnchorKey`で指定するメンバーの直前とし、`null`の場合は移動先の末尾に挿入する
 * （ref: docs/04_画面設計.md#挿入位置）。
 *
 * @param eventId 対象のイベントID
 * @param member 移動対象の乗車メンバー
 * @param sourceZoneId 移動元のドロップゾーンID（UNASSIGNED_ZONE_ID、またはCarpool.id）
 * @param targetZoneId 移動先のドロップゾーンID（UNASSIGNED_ZONE_ID、またはCarpool.id）
 * @param targetAnchorKey 移動先ゾーン内で、この直前に挿入する乗車メンバーのキー。末尾に挿入する場合はnull
 * @param carpools 選択中タブ（行き／帰り）の配車結果一覧（移動前の状態）
 */
export async function moveCarpoolMember(
  eventId: string,
  member: CarpoolMember,
  sourceZoneId: string,
  targetZoneId: string,
  targetAnchorKey: string | null,
  carpools: Carpool[]
): Promise<void> {
  if (sourceZoneId === targetZoneId && targetZoneId === UNASSIGNED_ZONE_ID) {
    return;
  }

  const key = memberKey(member);

  if (sourceZoneId !== targetZoneId && sourceZoneId !== UNASSIGNED_ZONE_ID) {
    const sourceCarpool = carpools.find((carpool) => carpool.id === sourceZoneId);
    if (sourceCarpool) {
      await updateCarpool(eventId, sourceCarpool.id, {
        members: sourceCarpool.members.filter((m) => memberKey(m) !== key),
      });
    }
  }

  if (targetZoneId !== UNASSIGNED_ZONE_ID) {
    const targetCarpool = carpools.find((carpool) => carpool.id === targetZoneId);
    if (targetCarpool) {
      const membersWithoutDuplicate = targetCarpool.members.filter((m) => memberKey(m) !== key);
      const anchorIndex = targetAnchorKey
        ? membersWithoutDuplicate.findIndex((m) => memberKey(m) === targetAnchorKey)
        : -1;
      const insertAt = anchorIndex === -1 ? membersWithoutDuplicate.length : anchorIndex;
      const reordered = [
        ...membersWithoutDuplicate.slice(0, insertAt),
        member,
        ...membersWithoutDuplicate.slice(insertAt),
      ];

      // 同一車内での並び替えで、結果的に並び順が変わらない場合は書き込みを行わない
      if (sourceZoneId === targetZoneId && sameOrder(reordered, targetCarpool.members)) {
        return;
      }

      await updateCarpool(eventId, targetCarpool.id, { members: reordered });
    }
  }
}

