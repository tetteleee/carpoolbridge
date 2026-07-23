/**
 * 自動配車アルゴリズムの前処理（データの初期化と基本バリデーション）
 * ref: docs/07_配車アルゴリズム.md#2.1 データの初期化と基本バリデーション
 */

import type { CarpoolMember, Direction } from '../../types/event';
import type { PickupLocation } from '../../types/master';
import type { Location } from './scoring';

/**
 * 前処理フェーズで初期化される車両データ
 * ref: docs/07_配車アルゴリズム.md#4.2 配車処理フロー（疑似コード）Vehicle
 */
export interface Vehicle {
  /** 運転者の所属家庭ID */
  driverFamilyId: string;
  /** ドライバーの集合場所ID（永続化・同値比較用） */
  driverPickupLocationId: string;
  /** ドライバーの集合場所（アルゴリズム用座標オブジェクト） */
  driverPickupLocation: Location;
  /** 有効定員（ドライバー分をあらかじめ1減算済み） */
  remainingCapacity: number;
  /** 経由予定の集合場所IDセット（O(1)検索用） */
  pickupLocationIds: Set<string>;
  /** 乗車メンバー（運転者は含めない） */
  members: CarpoolMember[];
}

/**
 * 車両データ初期化対象となる、車出し候補の家庭情報
 * ※driverPickupLocationは緯度経度バリデーション（validatePickupLocations）通過後の値を渡すこと
 */
export interface DrivingCandidate {
  /** 家庭ID */
  familyId: string;
  /** 車の総定員（運転者本人を含む） */
  vehicleCapacity: number;
  /** ドライバーの集合場所ID */
  driverPickupLocationId: string;
  /** ドライバーの集合場所（アルゴリズム用座標オブジェクト） */
  driverPickupLocation: Location;
  /** 行き車出し可否。未回答はnull */
  driverOutward: boolean | null;
  /** 帰り車出し可否。未回答はnull */
  driverReturn: boolean | null;
}

/**
 * 配車対象の集合場所（グループの集合場所・ドライバーの集合場所）に
 * 緯度・経度が未設定のものがないかを検証します。
 * 未設定の地点が1件でも存在する場合はエラーを送出し、自動配車処理を中断します。
 *
 * @param locations 検証対象の集合場所一覧（重複を含んでもよい）
 * @throws 緯度・経度が未設定の地点が存在する場合、該当地点名を含むエラー
 */
export function validatePickupLocations(locations: PickupLocation[]): void {
  const missingNames = locations
    .filter((location) => location.latitude === null || location.longitude === null)
    .map((location) => location.name);

  if (missingNames.length > 0) {
    const uniqueNames = [...new Set(missingNames)];
    throw new Error(
      `緯度経度が未設定の集合場所があります: ${uniqueNames.join('、')}`
    );
  }
}

/**
 * 対象方向（行き/帰り）の車出しフラグが true である車両を抽出し、
 * 有効定員（remainingCapacity = capacity - 1）を算出して初期化します。
 *
 * @param candidates 車出し候補の家庭一覧
 * @param direction 対象方向（行き/帰り）
 * @returns 初期化された車両データ一覧
 */
export function initializeVehicles(
  candidates: DrivingCandidate[],
  direction: Direction
): Vehicle[] {
  return candidates
    .filter((candidate) =>
      direction === 'OUTWARD'
        ? candidate.driverOutward === true
        : candidate.driverReturn === true
    )
    .map((candidate) => ({
      driverFamilyId: candidate.familyId,
      driverPickupLocationId: candidate.driverPickupLocationId,
      driverPickupLocation: candidate.driverPickupLocation,
      remainingCapacity: candidate.vehicleCapacity - 1,
      pickupLocationIds: new Set<string>(),
      members: [],
    }));
}
