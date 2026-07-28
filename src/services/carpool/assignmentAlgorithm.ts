/**
 * 自動配車アルゴリズムの割り当てフェーズ（分枝限定法による厳密探索）
 * ref: docs/07_配車アルゴリズム.md#4 割り当てフェーズ（分枝限定法による厳密探索）
 */

import type { Group, Vehicle } from './preprocessing';
import { getHaversineDistance } from './scoring';

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
 * 探索に許容する時間予算（ミリ秒）。
 * 分枝限定法は理論上組合せ爆発しうるため、この時間を超えて探索が終わらない場合は
 * 打ち切り、その時点で見つかっている最良解（暫定解）を返す。
 * 1回の配車作成操作で行き・帰り2方向分（本関数が2回）呼び出されるため、
 * モバイル端末のメインスレッドを合計で長時間ブロックしないよう、1回あたりの予算は短めに抑える。
 * ref: docs/07_配車アルゴリズム.md#5 計算量（Complexity）
 */
const SEARCH_TIME_BUDGET_MS = 50;

/**
 * 割当案の適合度を表す目的関数の値（辞書式順序で比較する3つ組）
 * ref: docs/07_配車アルゴリズム.md#3 目的関数（配置適合度評価）
 */
interface ObjectiveValue {
  /** 未配車人数（第1優先） */
  unassignedCount: number;
  /** 同一集合場所の超過訪問数（第2優先） */
  excessVisitCount: number;
  /** 総移動距離km（第3優先） */
  totalDistance: number;
}

/**
 * 2つの目的関数値を辞書式順序で比較します。
 * aがbより優れていれば負、劣っていれば正、完全に同値なら0を返します。
 */
function compareObjective(a: ObjectiveValue, b: ObjectiveValue): number {
  if (a.unassignedCount !== b.unassignedCount) {
    return a.unassignedCount - b.unassignedCount;
  }
  if (a.excessVisitCount !== b.excessVisitCount) {
    return a.excessVisitCount - b.excessVisitCount;
  }
  return a.totalDistance - b.totalDistance;
}

/**
 * 前処理フェーズ（T33・T34）で生成された車両配列・未配車グループ配列を受け取り、
 * 分枝限定法による網羅的探索で目的関数（未配車人数→同一集合場所の超過訪問数→
 * 総移動距離、の優先順位）を最小化する割当案を求め、配車割り当て結果
 * （割当済み車両・未配車リスト）を返します。
 *
 * 引数の元配列（vehicles・unassignedGroups）はシャローコピーした上で処理するため
 * 破壊されない。ただし複製後の車両・グループオブジェクト自体（members・
 * remainingCapacity・pickupLocationIds等）へは、探索中の一時的な参照ミューテーション
 * （バックトラックによる復元込み）を許容する（ref: docs/07_配車アルゴリズム.md#4.1）。
 *
 * @param vehicles 前処理済みの車両一覧
 * @param unassignedGroups 前処理済みの未配車グループ一覧
 * @returns 割り当て済み車両一覧・未配車グループ一覧
 */
export function runAutoAssignment(
  vehicles: Vehicle[],
  unassignedGroups: Group[]
): AssignmentResult {
  // 1. 車両・グループ配列のコピーと決定論的な探索順序の確定
  //    （ref: docs/07_配車アルゴリズム.md#3 決定論的動作のための最終タイブレーク）
  const sortedVehicles = [...vehicles].sort((a, b) =>
    a.driverFamilyId.localeCompare(b.driverFamilyId)
  );
  const sortedGroups = [...unassignedGroups].sort((a, b) => {
    if (b.size !== a.size) {
      return b.size - a.size;
    }
    return a.familyId.localeCompare(b.familyId);
  });

  // 集合場所ID→現在探索中に訪問している車両数（超過訪問数の算出用の作業状態）
  const visitCountByLocation = new Map<string, number>();

  let best: { objective: ObjectiveValue; assignments: Map<Group, Vehicle | null> } | null = null;

  // 時間予算の管理（打ち切り後は新たな分岐へ入らず、既知の最良解をそのまま返す）
  const searchStartedAt = Date.now();
  let timedOut = false;

  function currentObjective(unassignedCount: number, distanceSum: number): ObjectiveValue {
    let excessVisitCount = 0;
    for (const count of visitCountByLocation.values()) {
      excessVisitCount += Math.max(0, count - 1);
    }
    return { unassignedCount, excessVisitCount, totalDistance: distanceSum };
  }

  // グループを1件ずつ「どの車両に割り当てるか／未配車のままにするか」再帰的に決定する
  function search(
    index: number,
    unassignedCount: number,
    distanceSum: number,
    assignments: Map<Group, Vehicle | null>
  ): void {
    if (timedOut) {
      return;
    }

    // 時間予算チェック: 超過したら以降の分岐には入らず、既知の最良解を確定させる
    // （深さ優先探索の性質上、最初の葉に到達した時点でbestは非nullになっているため、
    // ここで打ち切っても実行可能な割当案は必ず得られる）
    if (Date.now() - searchStartedAt > SEARCH_TIME_BUDGET_MS) {
      timedOut = true;
      return;
    }

    // 枝刈り: 暫定値（unassignedCount・excessVisitCount・distanceSumはいずれも
    // 以降の決定によって単調非減少）は最終的な目的関数値の下界になるため、
    // 既に見つかっている最良解より劣っていればこの先の探索を打ち切る
    if (
      best !== null &&
      compareObjective(currentObjective(unassignedCount, distanceSum), best.objective) > 0
    ) {
      return;
    }

    // 葉に到達: 全グループの決定が完了
    if (index === sortedGroups.length) {
      const objective = currentObjective(unassignedCount, distanceSum);
      // 厳密不等号により、同点時は先に見つかった解（探索順序が優先する解）を保持する
      if (best === null || compareObjective(objective, best.objective) < 0) {
        best = { objective, assignments: new Map(assignments) };
      }
      return;
    }

    const group = sortedGroups[index];

    // 選択肢a: 乗車可能な車両へ割り当てる
    // 探索順序は、この時点で既にグループの集合場所を訪問済みの車両を優先し、
    // その中でdriverFamilyId昇順とする（同一集合場所への集約を優先的に発見し、
    // 早期に強い暫定解を確立することで、時間予算内での枝刈り効率を高めるため）。
    // ref: docs/07_配車アルゴリズム.md#3 決定論的動作のための最終タイブレーク
    const visitedFirstVehicles = [
      ...sortedVehicles.filter((vehicle) => vehicle.pickupLocationIds.has(group.pickupLocationId)),
      ...sortedVehicles.filter((vehicle) => !vehicle.pickupLocationIds.has(group.pickupLocationId)),
    ];
    for (const vehicle of visitedFirstVehicles) {
      if (vehicle.remainingCapacity >= group.size) {
        const isNewStop = !vehicle.pickupLocationIds.has(group.pickupLocationId);
        const distance = getHaversineDistance(vehicle.driverPickupLocation, group.pickupLocation);

        // 仮に割り当てる
        vehicle.remainingCapacity -= group.size;
        vehicle.pickupLocationIds.add(group.pickupLocationId);
        visitCountByLocation.set(
          group.pickupLocationId,
          (visitCountByLocation.get(group.pickupLocationId) ?? 0) + 1
        );
        assignments.set(group, vehicle);

        search(index + 1, unassignedCount, distanceSum + distance, assignments);

        // バックトラック: 仮の割当を取り消して元の状態へ戻す
        assignments.delete(group);
        const remaining = (visitCountByLocation.get(group.pickupLocationId) ?? 1) - 1;
        if (remaining === 0) {
          visitCountByLocation.delete(group.pickupLocationId);
        } else {
          visitCountByLocation.set(group.pickupLocationId, remaining);
        }
        if (isNewStop) {
          vehicle.pickupLocationIds.delete(group.pickupLocationId);
        }
        vehicle.remainingCapacity += group.size;
      }
    }

    // 選択肢b: 未配車のままにする
    assignments.set(group, null);
    search(index + 1, unassignedCount + group.size, distanceSum, assignments);
    assignments.delete(group);
  }

  search(0, 0, 0, new Map());

  // 最良解をVehicleへ確定反映する（探索中の仮割当はすべてバックトラックで戻っているため、
  // ここで一度だけ反映する）
  const unassignedList: Group[] = [];
  for (const [group, vehicle] of best!.assignments) {
    if (vehicle) {
      vehicle.members.push(...group.members);
      vehicle.remainingCapacity -= group.size;
      vehicle.pickupLocationIds.add(group.pickupLocationId);
    } else {
      unassignedList.push(group);
    }
  }

  return { assignedVehicles: sortedVehicles, unassignedList };
}
