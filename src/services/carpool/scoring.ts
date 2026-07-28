/**
 * 自動配車アルゴリズムの距離計算
 * ref: docs/07_配車アルゴリズム.md#3 目的関数（配置適合度評価）
 */

/**
 * 緯度・経度を持つ座標情報
 */
export interface Location {
  latitude: number;
  longitude: number;
}

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
