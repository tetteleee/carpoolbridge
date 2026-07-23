import { Timestamp } from 'firebase/firestore';

/**
 * 家庭（Family）を表す型
 * 1家庭につき1レコード
 */
export interface Family {
  /** ID */
  id: string;
  /** 〇〇家 */
  familyName: string;
  /** コーチ名。この家庭にコーチが紐づく場合のみ入力。空欄（null）はコーチなし */
  coachName: string | null;
  /** 車の総定員（運転者本人を含む。車を持たない場合は0） */
  vehicleCapacity: number;
  /** 家庭の集合場所（家庭に属する子供・コーチは全員この集合場所から乗車する） */
  pickupLocationId: string;
  /** 在籍中（falseで卒団・非表示扱い） */
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 子供（Child）を表す型
 */
export interface Child {
  id: string;
  familyId: string;
  name: string;
  /** 小学校の入学年度（例：2026）。学年はこの値から自動計算する */
  schoolEntryYear: number;
  /** 在籍中（falseで卒団・非表示扱い） */
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
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
