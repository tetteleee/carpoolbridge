/**
 * 自動配車アルゴリズムのスコアリング関数
 * ref: docs/07_配車アルゴリズム.md#3 スコアリング関数（配置適合度評価）
 */

/**
 * 緯度・経度を持つ座標情報
 */
export interface Location {
  latitude: number;
  longitude: number;
}

/**
 * スコア計算対象となる未割り当てグループ（家族グループ）
 * ※スコア計算に必要な最小限のプロパティのみを定義する
 */
export interface Group {
  /** 集合場所ID（永続化・同値比較用） */
  pickupLocationId: string;
  /** グループの集合場所（アルゴリズム用座標オブジェクト） */
  pickupLocation: Location;
}

/**
 * スコア計算対象となる車両
 * ※スコア計算に必要な最小限のプロパティのみを定義する
 */
export interface Vehicle {
  /** ドライバーの集合場所（アルゴリズム用座標オブジェクト） */
  driverPickupLocation: Location;
  /** 車両の経由予定集合場所IDセット（O(1)検索用） */
  pickupLocationIds: Set<string>;
}

/** 距離要素の重要度係数（基準値） */
const DISTANCE_WEIGHT = 1.0;
/** 車両の集合場所リストに新規経由地が追加される際のペナルティの重み */
const STOP_PENALTY_WEIGHT = 5.0;

/** 地球の半径（km） */
const EARTH_RADIUS_KM = 6371;

/**
 * 2地点間の直線距離をハバーシン公式で算出します。
 *
 * @param point1 地点1の座標
 * @param point2 地点2の座標
 * @returns 2地点間の直線距離（km）
 */
export function getHaversineDistance(point1: Location, point2: Location): number {
  const lat1Rad = (point1.latitude * Math.PI) / 180;
  const lat2Rad = (point2.latitude * Math.PI) / 180;
  const deltaLatRad = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const deltaLonRad = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRad / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLonRad / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * 未割り当てのグループGを車両Vに配置する際の適合度スコアを算出します。
 * スコア値が低いほど、配置適合度が高い（好ましい）ことを表す。
 * 副作用を持たない純粋関数であり、引数のgroup・vehicleの状態は変更しない。
 *
 * @param group 配置対象のグループ
 * @param vehicle 配置先候補の車両
 * @returns 配置適合度スコア
 */
export function calculateScore(group: Group, vehicle: Vehicle): number {
  const distance = getHaversineDistance(vehicle.driverPickupLocation, group.pickupLocation);
  const isNewStop = vehicle.pickupLocationIds.has(group.pickupLocationId) ? 0.0 : 1.0;

  return DISTANCE_WEIGHT * distance + STOP_PENALTY_WEIGHT * isNewStop;
}
