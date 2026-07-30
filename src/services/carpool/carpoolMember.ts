/**
 * 配車画面（メイン）における乗車メンバーの識別・移動処理
 * ref: docs/04_画面設計.md#8 ドラッグ＆ドロップ, docs/05_データ設計.md#9 Carpool（配車結果）
 */

import type { Carpool, CarpoolMember } from '../../types/event';
import { updateCarpool } from '../event/carpoolService';

/** 未配車エリアを表すドロップゾーンID（車カードはCarpool.idをそのままドロップゾーンIDとして使う） */
export const UNASSIGNED_ZONE_ID = 'unassigned';

/** 乗車メンバー（player/coach）を一意に識別するキーを生成する */
export function memberKey(member: CarpoolMember): string {
  return member.type === 'player' ? `player:${member.playerId}` : `coach:${member.familyId}`;
}

/**
 * 未配車エリア⇔車カード間、または車カード⇔車カード間で乗車メンバー1人を移動し、
 * T20のCarpool読み書き処理を通じて配車結果データへ反映する。
 * 車内の表示順は集合場所グルーピング＋学年・名前順で一意に決まるため（ref: docs/04_画面設計.md#集合場所グルーピング）、
 * 移動先ゾーン内での挿入位置は指定せず、常に末尾へ追加する。
 * 移動元と移動先が同一ゾーンの場合は何もしない（ref: docs/04_画面設計.md#挿入位置）。
 *
 * @param eventId 対象のイベントID
 * @param member 移動対象の乗車メンバー
 * @param sourceZoneId 移動元のドロップゾーンID（UNASSIGNED_ZONE_ID、またはCarpool.id）
 * @param targetZoneId 移動先のドロップゾーンID（UNASSIGNED_ZONE_ID、またはCarpool.id）
 * @param carpools 選択中タブ（行き／帰り）の配車結果一覧（移動前の状態）
 */
export async function moveCarpoolMember(
  eventId: string,
  member: CarpoolMember,
  sourceZoneId: string,
  targetZoneId: string,
  carpools: Carpool[]
): Promise<void> {
  if (sourceZoneId === targetZoneId) {
    return;
  }

  const key = memberKey(member);

  if (sourceZoneId !== UNASSIGNED_ZONE_ID) {
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
      await updateCarpool(eventId, targetCarpool.id, {
        members: [...membersWithoutDuplicate, member],
      });
    }
  }
}

