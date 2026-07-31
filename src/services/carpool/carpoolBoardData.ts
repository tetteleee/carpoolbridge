/**
 * 配車画面（メイン）・LINE共有（共有用画像）の双方で使う、
 * 配車結果（Carpool）と回答・マスタデータを突き合わせた表示用データへの変換処理
 * ref: docs/04_画面設計.md#8 未配車エリア・車カード, docs/05_データ設計.md#8,#9
 *
 * 配車画面（メイン）は選択中タブ（行き／帰り）1方向分のみを表示するが、
 * LINE共有の共有用画像は行き・帰り両方向を1枚にまとめるため、
 * 同じ変換処理を方向ごとに呼び出せるよう純粋関数として切り出している。
 */

import type { CarCardData } from '../../utils/carCard';
import type { PersonCardData } from '../../components/carpool/PersonCard';
import { getFamilies } from '../master/familyService';
import { getPlayersByFamilyId } from '../master/playerService';
import { getPickupLocations } from '../master/pickupLocationService';
import { getResponses } from '../event/responseService';
import {
  isPlayerNoRideNeededForDirection,
  isPlayerRidingForDirection,
  isCoachRidingForDirection,
  isCoachNoRideNeededForDirection,
  type EligibilityMasterData,
} from './eligibility';
import { getSchoolGrade } from '../../utils/schoolGrade';
import type { Carpool, CarpoolMember, Direction } from '../../types/event';
import type { PickupLocation } from '../../types/master';

/** 表示用データ変換に必要なマスタ・回答データ */
export interface BoardMasterData extends EligibilityMasterData {
  pickupLocationById: Map<string, PickupLocation>;
}

/** 配車画面（メイン）1方向分の表示用データ */
export interface CarpoolBoardData {
  /** 未配車の人カード一覧 */
  unassignedPeople: PersonCardData[];
  /** 配車不要（参加かつ送迎不要）の人カード一覧 */
  noRideNeededPeople: PersonCardData[];
  /** 車カード一覧 */
  carCards: CarCardData[];
}

/** 学年表記（例：「小4」）を生成する。対象学年外の場合はnullを返す */
function toGradeLabel(schoolEntryYear: number): string | null {
  const grade = getSchoolGrade(schoolEntryYear);
  return grade === null ? null : `小${grade}`;
}

/** 乗車メンバー（CarpoolMember）の集合場所IDを取得する。対応するマスタが見つからない場合はnull */
function getMemberPickupLocationId(
  member: CarpoolMember,
  masterData: BoardMasterData
): string | null {
  const familyId = member.type === 'player'
    ? masterData.playerById.get(member.playerId)?.familyId
    : member.familyId;
  if (!familyId) {
    return null;
  }
  return masterData.familyById.get(familyId)?.pickupLocationId ?? null;
}

/** 乗車メンバー（CarpoolMember）を人カード表示用データへ変換する。対応するマスタが見つからない場合はnull */
function toPersonCardData(
  member: CarpoolMember,
  masterData: BoardMasterData
): PersonCardData | null {
  const pickupLocationId = getMemberPickupLocationId(member, masterData);
  const pickupLocationName = pickupLocationId
    ? (masterData.pickupLocationById.get(pickupLocationId)?.name ?? '（削除済み）')
    : '';

  if (member.type === 'player') {
    const player = masterData.playerById.get(member.playerId);
    if (!player) {
      return null;
    }
    return {
      id: player.id,
      name: player.name,
      grade: toGradeLabel(player.schoolEntryYear),
      pickupLocationId: pickupLocationId ?? '',
      pickupLocationName,
      member,
    };
  }

  const family = masterData.familyById.get(member.familyId);
  if (!family || family.coachName === null) {
    return null;
  }
  return {
    id: family.id,
    name: family.coachName,
    grade: null,
    pickupLocationId: pickupLocationId ?? '',
    pickupLocationName,
    member,
  };
}

/**
 * 車カードの経由地一覧（集合場所名）を動的に算出する。
 * 運転者の集合場所を先頭とし、以降は乗車メンバーの並び順で重複を除いて追加する。
 * ref: docs/05_データ設計.md#9 経由地一覧（集合場所）
 */
function buildRouteLocationNames(carpool: Carpool, masterData: BoardMasterData): string[] {
  const driverPickupLocationId = masterData.familyById.get(
    carpool.driverFamilyId
  )?.pickupLocationId;

  const locationIds: string[] = [];
  if (driverPickupLocationId) {
    locationIds.push(driverPickupLocationId);
  }
  for (const member of carpool.members) {
    const locationId = getMemberPickupLocationId(member, masterData);
    if (locationId && !locationIds.includes(locationId)) {
      locationIds.push(locationId);
    }
  }

  return locationIds.map(
    (locationId) => masterData.pickupLocationById.get(locationId)?.name ?? '（削除済み）'
  );
}

/**
 * 対象方向において配車対象となる乗車メンバー（選手・コーチ）一覧を算出する。
 * ref: docs/05_データ設計.md#9 type: "player" について・type: "coach" について
 */
function buildEligibleMembers(masterData: BoardMasterData, direction: Direction): CarpoolMember[] {
  const members: CarpoolMember[] = [];

  for (const [familyId, response] of masterData.responseByFamilyId) {
    const family = masterData.familyById.get(familyId);
    if (!family || !family.isActive) {
      continue;
    }

    for (const player of response.players) {
      const playerMaster = masterData.playerById.get(player.playerId);
      if (
        playerMaster?.isActive &&
        playerMaster.familyId === familyId &&
        isPlayerRidingForDirection(player, direction)
      ) {
        members.push({ type: 'player', playerId: player.playerId });
      }
    }

    if (isCoachRidingForDirection(family, response, direction)) {
      members.push({ type: 'coach', familyId });
    }
  }

  return members;
}

/**
 * 対象方向において「参加かつ送迎不要」（配車不要エリアの対象）となる選手・コーチ一覧を算出する。
 * ref: docs/04_画面設計.md#8 配車不要エリア
 */
function buildNoRideNeededMembers(masterData: BoardMasterData, direction: Direction): CarpoolMember[] {
  const members: CarpoolMember[] = [];

  for (const [familyId, response] of masterData.responseByFamilyId) {
    const family = masterData.familyById.get(familyId);
    if (!family || !family.isActive) {
      continue;
    }

    for (const player of response.players) {
      const playerMaster = masterData.playerById.get(player.playerId);
      if (
        playerMaster?.isActive &&
        playerMaster.familyId === familyId &&
        isPlayerNoRideNeededForDirection(player, direction)
      ) {
        members.push({ type: 'player', playerId: player.playerId });
      }
    }

    if (isCoachNoRideNeededForDirection(family, response, direction)) {
      members.push({ type: 'coach', familyId });
    }
  }

  return members;
}

/** 乗車メンバー（player/coach）を一意に識別するキーを生成する（services/carpool/carpoolMember.tsのmemberKeyと同一基準） */
function memberKey(member: CarpoolMember): string {
  return member.type === 'player' ? `player:${member.playerId}` : `coach:${member.familyId}`;
}

/**
 * 対象イベントの表示用データ変換に必要なマスタ・回答データを取得する。
 *
 * @param eventId 対象のイベントID
 */
export async function loadBoardMasterData(eventId: string): Promise<BoardMasterData> {
  const [families, responses, pickupLocations] = await Promise.all([
    getFamilies(),
    getResponses(eventId),
    getPickupLocations(),
  ]);
  const playersLists = await Promise.all(
    families.map((family) => getPlayersByFamilyId(family.id))
  );

  const familyById = new Map(families.map((family) => [family.id, family]));
  const playerById = new Map(playersLists.flat().map((player) => [player.id, player]));
  const responseByFamilyId = new Map(
    responses.map((response) => [response.familyId, response])
  );
  const pickupLocationById = new Map(
    pickupLocations.map((location) => [location.id, location])
  );

  return { familyById, playerById, responseByFamilyId, pickupLocationById };
}

/**
 * 配車結果（Carpool）とマスタ・回答データから、対象方向1方向分の表示用データ
 * （未配車・配車不要・車カード）を算出する。
 *
 * @param direction 対象方向（行き／帰り）
 * @param carpools 対象方向の配車結果一覧
 * @param masterData loadBoardMasterDataで取得したマスタ・回答データ
 */
export function buildCarpoolBoardData(
  direction: Direction,
  carpools: Carpool[],
  masterData: BoardMasterData
): CarpoolBoardData {
  const assignedKeys = new Set(
    carpools.flatMap((carpool) => carpool.members).map(memberKey)
  );

  const unassignedPeople = buildEligibleMembers(masterData, direction)
    .filter((member) => !assignedKeys.has(memberKey(member)))
    .map((member) => toPersonCardData(member, masterData))
    .filter((person): person is PersonCardData => person !== null);

  const noRideNeededPeople = buildNoRideNeededMembers(masterData, direction)
    .map((member) => toPersonCardData(member, masterData))
    .filter((person): person is PersonCardData => person !== null);

  const carCards = carpools.map((carpool) => {
    const family = masterData.familyById.get(carpool.driverFamilyId);
    return {
      id: carpool.id,
      familyName: family?.familyName ?? '',
      capacity: carpool.capacity,
      routeLocationNames: buildRouteLocationNames(carpool, masterData),
      members: carpool.members
        .map((member) => toPersonCardData(member, masterData))
        .filter((person): person is PersonCardData => person !== null),
    };
  });

  return { unassignedPeople, noRideNeededPeople, carCards };
}
