import type { PersonCardData } from '../components/carpool/PersonCard';

/**
 * 車カード1台分のデータ。
 * 車カードデータの取得・算出処理自体は対象設計書に取得元の規定がないため対象外とし、
 * このデータは呼び出し元から渡される前提とする。
 */
export interface CarCardData {
  /** 配車ID */
  id: string;
  /** 家庭名（例：「山田家」）。カード上は「家」を除き「号」を付与した車名として表示する */
  familyName: string;
  /** 運転者本人を含む総定員 */
  capacity: number;
  /** 経由する集合場所名の一覧（表示順は巡回順を意味しない。実際の順番は当日ドライバーが判断する） */
  routeLocationNames: string[];
  /** 乗車メンバー（選手・コーチ・家族） */
  members: PersonCardData[];
}

/** 乗車人数を算出する（乗車メンバー数そのもの） */
export function computeOccupantCount(car: CarCardData): number {
  return car.members.length;
}
