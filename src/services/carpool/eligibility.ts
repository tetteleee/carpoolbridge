/**
 * 対象方向（行き／帰り）における配車対象者の判定処理
 * ref: docs/05_データ設計.md#9 Carpool（配車結果） type: "child" について・type: "coach" について
 *
 * runCarpoolAssignment（配車生成アルゴリズム）とuseCarpoolBoardData（配車画面表示用データ変換）の
 * 双方で同一の判定基準を使うため、共通処理として切り出す。
 */

import type { CarpoolMember, Direction, Response, ResponseChild } from '../../types/event';
import type { Child, Family } from '../../types/master';

/** メンバーの参加可否判定に必要なマスタ・回答データ */
export interface EligibilityMasterData {
  familyById: Map<string, Family>;
  childById: Map<string, Child>;
  responseByFamilyId: Map<string, Response>;
}

/** 対象方向における家庭の車出し可否（Response.driverOutward/driverReturn）を判定する */
export function isDriverForDirection(response: Response, direction: Direction): boolean {
  return direction === 'OUTWARD'
    ? response.driverOutward === true
    : response.driverReturn === true;
}

/** 対象方向における子供の配車要否（isParticipating・noOutwardRide/noReturnRide）を判定する */
export function isChildRidingForDirection(child: ResponseChild, direction: Direction): boolean {
  if (child.isParticipating !== true) {
    return false;
  }
  return direction === 'OUTWARD' ? !child.noOutwardRide : !child.noReturnRide;
}

/** 家庭に参加するコーチが紐づいているかどうか（車出し可否に関わらず判定） */
export function isCoachParticipating(
  family: Family | undefined,
  response: Response | undefined
): boolean {
  return !!family && family.coachName !== null && response?.coachParticipating === true;
}

/**
 * 対象方向において、乗車メンバー（子供・コーチ）が現在の回答内容でも引き続き配車対象かどうかを判定する。
 * Carpool.members に残っているメンバーが、回答変更後も対象のままかを確認するために使用する
 * （回答変更後の配車結果の自動整合処理向け）。
 */
export function isMemberEligibleForDirection(
  member: CarpoolMember,
  direction: Direction,
  masterData: EligibilityMasterData
): boolean {
  if (member.type === 'child') {
    const child = masterData.childById.get(member.childId);
    if (!child || !child.isActive) {
      return false;
    }
    const family = masterData.familyById.get(child.familyId);
    if (!family || !family.isActive) {
      return false;
    }
    const responseChild = masterData.responseByFamilyId
      .get(child.familyId)
      ?.children.find((c) => c.childId === member.childId);
    if (!responseChild) {
      return false;
    }
    return isChildRidingForDirection(responseChild, direction);
  }

  const family = masterData.familyById.get(member.familyId);
  if (!family || !family.isActive) {
    return false;
  }
  return isCoachParticipating(family, masterData.responseByFamilyId.get(member.familyId));
}
