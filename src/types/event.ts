import { Timestamp } from 'firebase/firestore';

/**
 * 往路（行き）または復路（帰り）を表す方向
 */
export type Direction = 'OUTWARD' | 'RETURN';

/**
 * イベント情報を表す型
 */
export interface Event {
  /** イベントID */
  id: string;
  /** イベント名（例：練習試合など） */
  name: string;
  /** 開催日（"YYYY-MM-DD"形式） */
  date: string;
  /** 目的地ID */
  destinationId: string;
  /** 作成日時 */
  createdAt: Timestamp;
  /** 更新日時 */
  updatedAt: Timestamp;
}

/**
 * イベント回答における子供個別の情報を表す型
 */
export interface ResponseChild {
  /** 子供ID */
  childId: string;
  /** イベントに参加するかどうか。未選択=null、参加=true、欠席=false */
  isParticipating: boolean | null;
  /** 行きの配車が不要かどうか（現地集合、午後から参加など） */
  noOutwardRide: boolean;
  /** 帰りの配車が不要かどうか（保護者迎え、現地解散など） */
  noReturnRide: boolean;
}

/**
 * イベント回答（家庭情報）を表す型
 */
export interface Response {
  /** 行き車出し可否。未選択（未回答）はnull */
  driverOutward: boolean | null;
  /** 帰り車出し可否。未選択（未回答）はnull */
  driverReturn: boolean | null;
  /** 当日乗車可能人数（運転者本人を含む総定員）の上書き。通常通りならnull */
  capacityToday: number | null;
  /** コーチが参加するかどうか。コーチが紐づかない家庭ではnull */
  coachParticipating: boolean | null;
  /** 特記事項（子供個別の特殊ケースもここに集約する） */
  remarks: string;
  /** 子供情報の配列 */
  children: ResponseChild[];
}

/**
 * 乗車メンバー（子ども）
 */
export interface CarpoolMemberChild {
  type: 'child';
  childId: string;
}

/**
 * 乗車メンバー（コーチ）
 */
export interface CarpoolMemberCoach {
  type: 'coach';
  familyId: string;
}

/**
 * 乗車メンバーを表すUnion型
 */
export type CarpoolMember = CarpoolMemberChild | CarpoolMemberCoach;

/**
 * 配車結果を表す型
 */
export interface Carpool {
  /** 配車ID */
  id: string;
  /** 方向（行き／帰り） */
  direction: Direction;
  /** 運転者の所属家庭ID */
  driverFamilyId: string;
  /** 運転者がコーチかどうか */
  driverIsCoach: boolean;
  /** 運転者本人を含む総定員 */
  capacity: number;
  /** 乗車メンバー（運転者は含めない） */
  members: CarpoolMember[];
}
