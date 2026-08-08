/**
 * 家庭（Family）を表す型
 * 1家庭につき1レコード
 */
export interface Family {
  /** ID */
  id: string;
  /** 〇〇家 */
  familyName: string;
  /** 車の総定員（運転者本人を含む。車を持たない場合は0） */
  vehicleCapacity: number;
  /** 家庭の集合場所（家庭に属する選手・コーチ・家族は全員この集合場所から乗車する） */
  pickupLocationId: string;
  /** 在籍中（falseで卒団・非表示扱い） */
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 選手（Player）を表す型
 */
export interface Player {
  id: string;
  familyId: string;
  name: string;
  /** 小学校の入学年度（例：2026）。学年はこの値から自動計算する */
  schoolEntryYear: number;
  /** 在籍中（falseで卒団・非表示扱い） */
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * コーチ（Coach）を表す型
 * 選手の保護者がコーチを兼ねる場合に登録する。1家庭に複数人登録できる。
 */
export interface Coach {
  id: string;
  familyId: string;
  name: string;
  /** 在籍中（falseで非表示扱い） */
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 家族（FamilyMember）を表す型
 * 選手・コーチ以外で配車の対象になり得る人（兄弟・祖父母など）
 */
export interface FamilyMember {
  id: string;
  familyId: string;
  name: string;
  /** 在籍中（falseで非表示扱い） */
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 集合場所（PickupLocation）を表す型
 */
export interface PickupLocation {
  id: string;
  name: string;
  /** 緯度。未入力の場合はnull（緯度経度未設定） */
  latitude: number | null;
  /** 経度。未入力の場合はnull（緯度経度未設定） */
  longitude: number | null;
}

/**
 * 目的地（Destination）を表す型
 */
export interface Destination {
  id: string;
  name: string;
  /** 緯度。未入力の場合はnull（緯度経度未設定） */
  latitude: number | null;
  /** 経度。未入力の場合はnull（緯度経度未設定） */
  longitude: number | null;
}
