/**
 * 回答変更後の配車結果自動整合処理
 * ref: docs/04_画面設計.md#8 配車画面（メイン）
 *
 * 配車作成後に回答が変更され、Carpool.membersに含まれる選手・コーチが
 * 対象方向の配車対象から外れた（不参加・送迎不要等になった）場合、
 * その1件だけを対象のCarpoolドキュメントから取り除く。
 * 他の車・他のメンバーの手動修正済みの配置には一切影響しない。
 *
 * 新たに参加対象になった人（未回答→参加など）は、対象外にする処理を持たない
 * （useCarpoolBoardDataの未配車エリア算出により自動的に表示されるため、書き込みは不要）。
 */

import type { Carpool, Direction } from '../../types/event';
import { isMemberEligibleForDirection, type EligibilityMasterData } from './eligibility';
import { updateCarpool } from '../event/carpoolService';

/**
 * 対象方向の配車結果一覧について、現在の回答内容で対象外になったメンバーを
 * 各Carpoolドキュメントから取り除く。
 *
 * @param eventId 対象のイベントID
 * @param direction 対象方向（行き／帰り）
 * @param carpools 整合対象の配車結果一覧（対象方向のみ）
 * @param masterData 現在のマスタ・回答データ
 * @returns 1件以上のCarpoolを更新した場合はtrue
 */
export async function reconcileIneligibleMembers(
  eventId: string,
  direction: Direction,
  carpools: Carpool[],
  masterData: EligibilityMasterData
): Promise<boolean> {
  const updates: Promise<void>[] = [];

  for (const carpool of carpools) {
    const eligibleMembers = carpool.members.filter((member) =>
      isMemberEligibleForDirection(member, direction, masterData)
    );
    if (eligibleMembers.length !== carpool.members.length) {
      updates.push(updateCarpool(eventId, carpool.id, { members: eligibleMembers }));
    }
  }

  if (updates.length === 0) {
    return false;
  }

  await Promise.all(updates);
  return true;
}
