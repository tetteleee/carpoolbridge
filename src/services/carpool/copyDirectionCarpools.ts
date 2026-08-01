/**
 * 行き⇔帰りコピー処理
 * ref: docs/04_画面設計.md#8 行き⇔帰りコピー, docs/05_データ設計.md#12 例外：行き⇔帰りコピー
 *
 * コピー先方向の既存の配車結果を全削除したうえで、コピー元方向の配車結果を基に
 * コピー先方向の配車結果を新規作成する。
 */

import type { Carpool, Direction } from '../../types/event';
import {
  isDriverForDirection,
  isMemberEligibleForDirection,
  type EligibilityMasterData,
} from './eligibility';
import { reconcileCarpools } from './reconcileCarpools';
import {
  createCarpool,
  deleteCarpoolsByDirection,
  getCarpools,
} from '../event/carpoolService';

/**
 * コピー元方向の配車結果を、コピー先方向へコピーする。
 *
 * - コピー元の車の運転者家庭が、コピー先方向では車出し不可（対象外）の場合、その車は
 *   丸ごとコピーしない（乗客だったメンバーは結果的に未配車として扱われる）。
 * - コピー元の車に乗っていたメンバーのうち、コピー先方向では対象外になる人
 *   （不参加・送迎不要等）は、コピー先の車には含めない。
 * - コピー後、既存の自動整合処理（reconcileCarpools）を適用し、コピー先方向で
 *   車出し可能なのにコピー元に車がなかった家庭の空車を補完する。
 *
 * @param eventId 対象のイベントID
 * @param sourceDirection コピー元の方向
 * @param targetDirection コピー先の方向
 * @param masterData 現在のマスタ・回答データ
 */
export async function copyDirectionCarpools(
  eventId: string,
  sourceDirection: Direction,
  targetDirection: Direction,
  masterData: EligibilityMasterData
): Promise<void> {
  const sourceCarpools = await getCarpools(eventId, sourceDirection);

  await deleteCarpoolsByDirection(eventId, targetDirection);

  const createdCarpools: Carpool[] = [];
  for (const sourceCarpool of sourceCarpools) {
    const response = masterData.responseByFamilyId.get(sourceCarpool.driverFamilyId);
    const family = masterData.familyById.get(sourceCarpool.driverFamilyId);
    if (!response || !family || !family.isActive || !isDriverForDirection(response, targetDirection)) {
      continue;
    }

    const capacity = response.capacityToday ?? family.vehicleCapacity;
    const members = sourceCarpool.members.filter((member) =>
      isMemberEligibleForDirection(member, targetDirection, masterData)
    );

    const id = await createCarpool(eventId, {
      direction: targetDirection,
      driverFamilyId: sourceCarpool.driverFamilyId,
      capacity,
      members,
    });
    createdCarpools.push({
      id,
      direction: targetDirection,
      driverFamilyId: sourceCarpool.driverFamilyId,
      capacity,
      members,
    });
  }

  await reconcileCarpools(eventId, targetDirection, createdCarpools, masterData);
}
