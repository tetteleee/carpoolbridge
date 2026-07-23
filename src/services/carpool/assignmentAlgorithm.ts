/**
 * 自動配車アルゴリズムの割り当てフェーズ（決定論的ソート・貪欲法マッチング）
 * ref: docs/07_配車アルゴリズム.md#4 割り当てフェーズ（貪欲法ロジック）
 */

import type { Group, Vehicle } from './preprocessing';
import { calculateScore } from './scoring';

/**
 * runAutoAssignmentの戻り値
 */
export interface AssignmentResult {
  /** 割り当て処理後の車両一覧（driverFamilyId昇順にソート済み） */
  assignedVehicles: Vehicle[];
  /** 乗車可能な車両が1台も存在しなかった未配車グループ一覧 */
  unassignedList: Group[];
}

/**
 * 前処理フェーズ（T33・T34）で生成された車両配列・未配車グループ配列を受け取り、
 * 決定論的なソートと貪欲法によるスコアベースのマッチングを行い、
 * 配車割り当て結果（割当済み車両・未配車リスト）を返します。
 *
 * 引数の元配列（vehicles・unassignedGroups）はシャローコピーした上で処理するため
 * 破壊されない。ただし複製後の車両・グループオブジェクト自体（members・
 * remainingCapacity・pickupLocationIds等）へは参照ミューテーションを許容する
 * （ref: docs/07_配車アルゴリズム.md#4.1）。
 *
 * @param vehicles 前処理済みの車両一覧
 * @param unassignedGroups 前処理済みの未配車グループ一覧
 * @returns 割り当て済み車両一覧・未配車グループ一覧
 */
export function runAutoAssignment(
  vehicles: Vehicle[],
  unassignedGroups: Group[]
): AssignmentResult {
  // 1. 車両配列のコピーと決定論的ソート（driverFamilyIdの昇順）
  const sortedVehicles = [...vehicles].sort((a, b) =>
    a.driverFamilyId.localeCompare(b.driverFamilyId)
  );

  // 2. 未配車グループ配列のコピーと決定論的ソート
  //    第一順位: 構成員数（size）の降順、第二順位: familyIdの昇順
  const sortedGroups = [...unassignedGroups].sort((a, b) => {
    if (b.size !== a.size) {
      return b.size - a.size;
    }
    return a.familyId.localeCompare(b.familyId);
  });

  const unassignedList: Group[] = [];

  for (const group of sortedGroups) {
    let bestVehicle: Vehicle | null = null;
    let minScore = Infinity;

    // 3. このグループが乗車可能な車両の中から、最もスコアが低い車両を探索する
    //    厳密不等号（score < minScore）により、同点時はソート順で先に位置する
    //    （インデックスが若い）車両を優先させる
    for (const vehicle of sortedVehicles) {
      if (vehicle.remainingCapacity >= group.size) {
        const score = calculateScore(group, vehicle);
        if (score < minScore) {
          minScore = score;
          bestVehicle = vehicle;
        }
      }
    }

    // 4. 割り当ての実行、または未配車リストへの退避
    if (bestVehicle) {
      bestVehicle.members.push(...group.members);
      bestVehicle.remainingCapacity -= group.size;
      bestVehicle.pickupLocationIds.add(group.pickupLocationId);
    } else {
      unassignedList.push(group);
    }
  }

  return { assignedVehicles: sortedVehicles, unassignedList };
}
