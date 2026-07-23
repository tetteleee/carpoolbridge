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
  /** 運転者の表示名（優先割り当て超過エラー等での表示用） */
  driverName: string;
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
  /** 運転者の表示名（優先割り当て超過エラー等での表示用） */
  driverName: string;
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
 * 家族グループ形成対象となる乗客1人分の情報
 * ref: docs/07_配車アルゴリズム.md#2.2 家族グループ（Family Group）の形成
 */
export interface Passenger {
  /** 所属家庭ID */
  familyId: string;
  /** 所属家庭の集合場所ID（永続化・同値比較用） */
  pickupLocationId: string;
  /** 所属家庭の集合場所（アルゴリズム用座標オブジェクト） */
  pickupLocation: Location;
  /** 乗車メンバー情報（子供またはコーチ） */
  member: CarpoolMember;
}

/**
 * 家庭（familyId）単位に統合された乗客グループ
 * ref: docs/07_配車アルゴリズム.md#2.2 家族グループ（Family Group）の形成
 */
export interface Group {
  /** 所属家庭ID */
  familyId: string;
  /** 必要席数（構成員の合計人数。ドライバー本人は除く） */
  size: number;
  /** 集合場所ID（永続化・同値比較用） */
  pickupLocationId: string;
  /** 集合場所（アルゴリズム用座標オブジェクト） */
  pickupLocation: Location;
  /** グループの乗車メンバー */
  members: CarpoolMember[];
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
      driverName: candidate.driverName,
      driverPickupLocationId: candidate.driverPickupLocationId,
      driverPickupLocation: candidate.driverPickupLocation,
      remainingCapacity: candidate.vehicleCapacity - 1,
      pickupLocationIds: new Set<string>(),
      members: [],
    }));
}

/**
 * 乗客を家庭（familyId）単位で1つのグループに統合します。
 * 「兄弟は同じ車」「乗客コーチは所属家庭の子供と同じ集合場所から乗車」という
 * 絶対制約をコードの構造で解決するため、以降の割り当て処理は家庭単位のグループを対象に行う。
 * ref: docs/07_配車アルゴリズム.md#2.2 家族グループ（Family Group）の形成
 *
 * @param passengers 家庭単位に統合する前の乗客一覧
 * @returns familyId単位に統合されたグループ一覧
 */
export function formFamilyGroups(passengers: Passenger[]): Group[] {
  const groupsByFamilyId = new Map<string, Group>();

  for (const passenger of passengers) {
    const existingGroup = groupsByFamilyId.get(passenger.familyId);

    if (existingGroup) {
      existingGroup.size += 1;
      existingGroup.members.push(passenger.member);
      continue;
    }

    groupsByFamilyId.set(passenger.familyId, {
      familyId: passenger.familyId,
      size: 1,
      pickupLocationId: passenger.pickupLocationId,
      pickupLocation: passenger.pickupLocation,
      members: [passenger.member],
    });
  }

  return [...groupsByFamilyId.values()];
}

/**
 * ドライバー家族グループ（ドライバー本人を除いた、同乗必須の家族グループ）の
 * 必要席数が対応車両の有効定員を超過していないか検証したうえで、
 * 各車両へドライバー家族グループを優先割り当てします。
 * ref: docs/07_配車アルゴリズム.md#2.3 優先割り当てグループの定員検証と割当
 *
 * 超過している車両が1件でも存在する場合は、割り当てを一切行わずに
 * 処理を中断する（Early Exit）。これにより、不正データに基づく部分的な割り当てが
 * 発生することを防ぐ。
 *
 * @param vehicles T33で初期化済みの車両一覧（優先割り当てにより remainingCapacity・members・pickupLocationIds がミューテーションされる）
 * @param groups T34で形成した家族グループ一覧（ドライバー家庭のグループを含む全グループ）
 * @returns 優先割り当て済みのグループを除いた、以降の自動配車対象となる未配車グループ配列
 * @throws ドライバー家族グループの必要席数が車両の有効定員を超過している場合、対象ドライバー名を含むエラー
 */
export function assignDriverFamilyGroups(
  vehicles: Vehicle[],
  groups: Group[]
): Group[] {
  const driverGroupByVehicle = new Map<Vehicle, Group | undefined>();

  for (const vehicle of vehicles) {
    const driverGroup = groups.find(
      (group) => group.familyId === vehicle.driverFamilyId
    );
    driverGroupByVehicle.set(vehicle, driverGroup);

    if (driverGroup && driverGroup.size > vehicle.remainingCapacity) {
      throw new Error(
        `${vehicle.driverName}様の優先割り当て人数（同乗必須メンバー数）が、車両の有効定員を超過しています`
      );
    }
  }

  const assignedFamilyIds = new Set<string>();

  for (const vehicle of vehicles) {
    const driverGroup = driverGroupByVehicle.get(vehicle);
    if (!driverGroup) {
      continue;
    }

    vehicle.members.push(...driverGroup.members);
    vehicle.remainingCapacity -= driverGroup.size;
    vehicle.pickupLocationIds.add(driverGroup.pickupLocationId);
    assignedFamilyIds.add(driverGroup.familyId);
  }

  return groups.filter((group) => !assignedFamilyIds.has(group.familyId));
}
