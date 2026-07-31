/**
 * 回答変更後の配車結果自動整合処理
 * ref: docs/04_画面設計.md#8 画面を開いた際の自動整合, docs/05_データ設計.md#12 例外
 *
 * 配車画面を開くたびに、以下2種類の整合を行う。
 *
 * 1. 対象外になった乗車メンバーの除去
 *    Carpool.membersに含まれる選手・コーチ・家族が、回答変更により対象方向の配車対象から
 *    外れた（不参加・送迎不要等になった）場合、その1件だけを対象のCarpoolドキュメントから
 *    取り除く。他の車・他のメンバーの手動修正済みの配置には一切影響しない。
 *    新たに参加対象になった人（未回答→参加など）は対象外にする処理を持たない
 *    （useCarpoolBoardDataの未配車エリア算出により自動的に表示されるため、書き込みは不要）。
 *
 * 2. 車出し可否の変更に応じた車の自動追加・削除
 *    車出し可否（driverOutward/driverReturn）が可→不可に変わった家庭の車が存在する場合は
 *    削除する（乗車していたメンバーは未配車として扱われる）。不可→可に変わった家庭で
 *    対象方向に車がまだ存在しない場合は、空の車を新規作成する。
 *    対象方向にCarpoolが1件も存在しない（自動配車が未実行の）イベントでは、
 *    この整合処理自体を実行しない（呼び出し側のガードによる）。
 */

import type { Carpool, Direction } from '../../types/event';
import {
  isDriverForDirection,
  isMemberEligibleForDirection,
  type EligibilityMasterData,
} from './eligibility';
import { createCarpool, deleteCarpool, updateCarpool } from '../event/carpoolService';

/**
 * 対象方向の配車結果一覧について、現在の回答内容に基づき以下を反映する。
 * - 対象外になったメンバーの除去
 * - 車出し可否の変更に応じた車の自動追加・削除
 *
 * @param eventId 対象のイベントID
 * @param direction 対象方向（行き／帰り）
 * @param carpools 整合対象の配車結果一覧（対象方向のみ。呼び出し側で1件以上存在することを確認済みとする）
 * @param masterData 現在のマスタ・回答データ
 * @returns 1件以上のCarpoolを作成・更新・削除した場合はtrue
 */
export async function reconcileCarpools(
  eventId: string,
  direction: Direction,
  carpools: Carpool[],
  masterData: EligibilityMasterData
): Promise<boolean> {
  const carpoolByDriverFamilyId = new Map(carpools.map((carpool) => [carpool.driverFamilyId, carpool]));
  const deletedDriverFamilyIds = new Set<string>();
  const operations: Promise<unknown>[] = [];

  for (const [familyId, response] of masterData.responseByFamilyId) {
    const family = masterData.familyById.get(familyId);
    if (!family || !family.isActive) {
      continue;
    }

    const isDriver = isDriverForDirection(response, direction);
    const existingCarpool = carpoolByDriverFamilyId.get(familyId);

    if (isDriver && !existingCarpool) {
      operations.push(
        createCarpool(eventId, {
          direction,
          driverFamilyId: familyId,
          capacity: response.capacityToday ?? family.vehicleCapacity,
          members: [],
        })
      );
    } else if (!isDriver && existingCarpool) {
      deletedDriverFamilyIds.add(familyId);
      operations.push(deleteCarpool(eventId, existingCarpool.id));
    }
  }

  for (const carpool of carpools) {
    if (deletedDriverFamilyIds.has(carpool.driverFamilyId)) {
      continue;
    }
    const eligibleMembers = carpool.members.filter((member) =>
      isMemberEligibleForDirection(member, direction, masterData)
    );
    if (eligibleMembers.length !== carpool.members.length) {
      operations.push(updateCarpool(eventId, carpool.id, { members: eligibleMembers }));
    }
  }

  if (operations.length === 0) {
    return false;
  }

  await Promise.all(operations);
  return true;
}
