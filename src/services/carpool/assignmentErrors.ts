/**
 * 自動配車アルゴリズムの例外系ハンドリング（Hard Failエラー・警告メッセージ）
 * ref: docs/07_配車アルゴリズム.md#6 例外系・境界条件設計
 */

import type { Group } from './preprocessing';

/**
 * 緯度経度未登録エラー（Hard Fail）
 * 原因となった集合場所名を保持する。
 * ref: docs/07_配車アルゴリズム.md#6 緯度経度情報の未登録
 */
export class MissingCoordinatesError extends Error {
  /** 緯度経度が未登録の集合場所名一覧（重複なし） */
  readonly locationNames: string[];

  constructor(locationNames: string[]) {
    super(
      `位置情報が未登録の集合場所（${locationNames.join('、')}）が存在するため、自動配車を開始できません`
    );
    this.name = 'MissingCoordinatesError';
    this.locationNames = locationNames;
  }
}

/**
 * 優先割り当てグループの定員超過エラー（Hard Fail）
 * 原因となったドライバー名を保持する。
 * ref: docs/07_配車アルゴリズム.md#6 優先割り当てグループが定員を超過
 */
export class DriverGroupCapacityExceededError extends Error {
  /** 定員超過の原因となったドライバーの表示名 */
  readonly driverName: string;

  constructor(driverName: string) {
    super(
      `${driverName}様の優先割り当て人数（同乗必須メンバー数）が、車両の有効定員（車両定員 - 1名）を超過しています。登録データを確認してください`
    );
    this.name = 'DriverGroupCapacityExceededError';
    this.driverName = driverName;
  }
}

/** 前処理フェーズ（T33・T34）で発生しうるHard Failエラー */
export type AssignmentHardFailError =
  | MissingCoordinatesError
  | DriverGroupCapacityExceededError;

/** 配車枠不足警告（unassignedListが1件以上存在する場合） */
export interface CapacityShortageWarning {
  type: 'CAPACITY_SHORTAGE';
  message: string;
  /** 未配車のまま残ったグループ一覧（未配車エリア表示用） */
  unassignedGroups: Group[];
}

/** 未回答家庭が存在する場合の警告 */
export interface UnansweredFamiliesWarning {
  type: 'UNANSWERED_FAMILIES';
  message: string;
  /** 未回答家庭数 */
  unansweredCount: number;
}

/** 割り当てフェーズの結果から生成される警告（種別ごとに判別可能） */
export type AssignmentWarning = CapacityShortageWarning | UnansweredFamiliesWarning;

/**
 * 割り当てフェーズ（T35 runAutoAssignment）の未配車グループ一覧と、
 * 対象イベント・方向における未回答家庭数から、設計書#6のとおりの文言で
 * 警告一覧を生成します。該当する状態が発生していない警告種別は結果に含めません。
 *
 * @param unassignedList runAutoAssignmentの結果、乗車可能な車両が見つからなかった未配車グループ一覧
 * @param unansweredCount 対象イベント・方向における未回答家庭数
 * @returns 発生している警告一覧（種別ごとに判別可能な構造。何も発生していなければ空配列）
 */
export function buildAssignmentWarnings(
  unassignedList: Group[],
  unansweredCount: number
): AssignmentWarning[] {
  const warnings: AssignmentWarning[] = [];

  if (unassignedList.length > 0) {
    warnings.push({
      type: 'CAPACITY_SHORTAGE',
      message:
        '配車枠が不足しています。車出しを追加するか、未配車メンバーを手動で車へ割り当ててください',
      unassignedGroups: unassignedList,
    });
  }

  if (unansweredCount > 0) {
    warnings.push({
      type: 'UNANSWERED_FAMILIES',
      message: `未回答者が${unansweredCount}名います`,
      unansweredCount,
    });
  }

  return warnings;
}
