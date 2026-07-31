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
 * イベント回答における選手個別の情報を表す型
 */
export interface ResponsePlayer {
  /** 選手ID */
  playerId: string;
  /** イベントに参加するかどうか。未選択=null、参加=true、欠席=false */
  isParticipating: boolean | null;
  /** 行きの配車が不要かどうか（現地集合、午後から参加など） */
  noOutwardRide: boolean;
  /** 帰りの配車が不要かどうか（保護者迎え、現地解散など） */
  noReturnRide: boolean;
}

/**
 * イベント回答における家族個別の情報を表す型
 * ResponsePlayerと全く同じ構造・意味を持つ（05_データ設計.md#9 家族情報）
 */
export interface ResponseFamilyMember {
  /** 家族ID */
  familyMemberId: string;
  /** イベントに参加するかどうか。未選択=null、参加=true、欠席=false */
  isParticipating: boolean | null;
  /** 行きの配車が不要かどうか（現地集合、午後から参加など） */
  noOutwardRide: boolean;
  /** 帰りの配車が不要かどうか（保護者迎え、現地解散など） */
  noReturnRide: boolean;
}

/**
 * イベント回答における一時参加者（今回だけ参加する人）個別の情報を表す型。
 * マスタ（FamilyMember）には存在せず、このResponseドキュメント内にのみ保持する
 * （05_データ設計.md#9 一時参加者情報）。
 */
export interface ResponseTemporaryParticipant {
  /** 一時参加者ID。イベント・家庭内で一意な値（追加時に生成） */
  id: string;
  /** 名前（自由入力） */
  name: string;
  /**
   * 集合場所ID。選手・家族と異なり、所属家庭のFamily.pickupLocationIdを
   * 自動参照するのではなく、追加時に指定したこの値を直接使用する
   */
  pickupLocationId: string;
  /** イベントに参加するかどうか。選手・家族と異なりnull（未選択）を経由せず、追加した時点で常にtrue */
  isParticipating: boolean;
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
  /** 行きのコーチの配車が不要かどうか（現地集合など） */
  coachNoOutwardRide: boolean;
  /** 帰りのコーチの配車が不要かどうか（保護者迎えなど） */
  coachNoReturnRide: boolean;
  /** 特記事項（選手個別の特殊ケースもここに集約する） */
  remarks: string;
  /** 選手情報の配列 */
  players: ResponsePlayer[];
  /** 家族情報の配列。家族が1人も登録されていない家庭では空配列 */
  familyMembers: ResponseFamilyMember[];
  /** 一時参加者（今回だけ参加する人）情報の配列。1人もいない家庭では空配列 */
  temporaryParticipants: ResponseTemporaryParticipant[];
}

/**
 * 乗車メンバー（選手）
 */
export interface CarpoolMemberPlayer {
  type: 'player';
  playerId: string;
}

/**
 * 乗車メンバー（コーチ）
 */
export interface CarpoolMemberCoach {
  type: 'coach';
  familyId: string;
}

/**
 * 乗車メンバー（家族）
 */
export interface CarpoolMemberFamily {
  type: 'family';
  familyMemberId: string;
}

/**
 * 乗車メンバー（一時参加者。今回だけ参加する人）
 * 他の3種と異なりマスタに存在しないため、名前・集合場所は
 * events/{eventId}/responses/{familyId}のtemporaryParticipants[]から解決する
 * （05_データ設計.md#10 type: "temporary" について）。
 */
export interface CarpoolMemberTemporary {
  type: 'temporary';
  familyId: string;
  temporaryParticipantId: string;
}

/**
 * 乗車メンバーを表すUnion型
 */
export type CarpoolMember =
  | CarpoolMemberPlayer
  | CarpoolMemberCoach
  | CarpoolMemberFamily
  | CarpoolMemberTemporary;

/**
 * 配車結果を表す型
 */
export interface Carpool {
  /** 配車ID */
  id: string;
  /** 方向（行き／帰り） */
  direction: Direction;
  /** この車を出す家庭ID（運転者個人を特定するデータではない） */
  driverFamilyId: string;
  /** 運転者本人を含む総定員 */
  capacity: number;
  /** 乗車メンバー（実体を持たない運転者（保護者）は含めない。家庭に参加コーチがいる場合はコーチ自身も通常のメンバーとして含む） */
  members: CarpoolMember[];
}
