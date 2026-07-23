/**
 * 対象方向（行き／帰り）における配車対象者の判定処理
 * ref: docs/05_データ設計.md#9 Carpool（配車結果） type: "child" について・type: "coach" について
 *
 * runCarpoolAssignment（配車生成アルゴリズム）とuseCarpoolBoardData（配車画面表示用データ変換）の
 * 双方で同一の判定基準を使うため、共通処理として切り出す。
 */

import type { Direction, Response, ResponseChild } from '../../types/event';

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
