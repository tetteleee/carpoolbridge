/**
 * 配車画面（メイン）・LINE共有（共有用画像）の双方で使う、
 * 配車結果（Carpool）と回答・マスタデータを突き合わせた表示用データへの変換処理
 * ref: docs/04_画面設計.md#8 未配車エリア・車カード, docs/05_データ設計.md#9,#10
 *
 * 配車画面（メイン）は選択中タブ（行き／帰り）1方向分のみを表示するが、
 * LINE共有の共有用画像は行き・帰り両方向を1枚にまとめるため、
 * 同じ変換処理を方向ごとに呼び出せるよう純粋関数として切り出している。
 */

import type { CarCardData } from '../../utils/carCard';
import type { PersonCardData } from '../../components/carpool/PersonCard';
import { getFamilies } from '../master/familyService';
import { getPlayersByFamilyId } from '../master/playerService';
import { getCoachesByFamilyId } from '../master/coachService';
import { getFamilyMembersByFamilyId } from '../master/familyMemberService';
import { getPickupLocations } from '../master/pickupLocationService';
import { getResponses } from '../event/responseService';
import {
  isPlayerNoRideNeededForDirection,
  isPlayerRidingForDirection,
  isCoachRidingForDirection,
  isCoachNoRideNeededForDirection,
  isFamilyMemberRidingForDirection,
  isFamilyMemberNoRideNeededForDirection,
  isTemporaryParticipantRidingForDirection,
  isTemporaryParticipantNoRideNeededForDirection,
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

/**
 * 乗車メンバー（CarpoolMember）の集合場所IDを取得する。対応するマスタが見つからない場合はnull。
 * type: "temporary"のみ、所属家庭のFamily.pickupLocationIdではなく、追加時に指定した
 * Response.temporaryParticipants[].pickupLocationIdを直接参照する（05_データ設計.md#10参照）。
 */
function getMemberPickupLocationId(
  member: CarpoolMember,
  masterData: BoardMasterData
): string | null {
  if (member.type === 'temporary') {
    const temporaryParticipant = masterData.responseByFamilyId
      .get(member.familyId)
      ?.temporaryParticipants?.find((t) => t.id === member.temporaryParticipantId);
    return temporaryParticipant?.pickupLocationId ?? null;
  }

  let familyId: string | undefined;
  if (member.type === 'player') {
    familyId = masterData.playerById.get(member.playerId)?.familyId;
  } else if (member.type === 'family') {
    familyId = masterData.familyMemberById.get(member.familyMemberId)?.familyId;
  } else {
    familyId = masterData.coachById.get(member.coachId)?.familyId;
  }
  if (!familyId) {
    return null;
  }
  return masterData.familyById.get(familyId)?.pickupLocationId ?? null;
}

/** 参照先マスタが削除済みで解決できない乗車メンバー用の人カードデータを生成する（05_データ設計.md#12 削除方針） */
function toDeletedPersonCardData(id: string, member: CarpoolMember): PersonCardData {
  return {
    id,
    name: '（削除済み）',
    grade: null,
    pickupLocationId: '',
    pickupLocationName: '（削除済み）',
    member,
  };
}

/**
 * 乗車メンバー（CarpoolMember）を人カード表示用データへ変換する。
 * 対応するマスタ（選手・家族・家庭）が物理削除済み、または一時参加者が取り消し（×ボタン）
 * 済みで見つからない場合は、nullを返して非表示にするのではなく「（削除済み）」の人カードを返す
 * （過去の配車結果で乗車していた事実自体が分からなくなることを防ぐため。05_データ設計.md#12 削除方針）。
 */
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
      return toDeletedPersonCardData(member.playerId, member);
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

  if (member.type === 'family') {
    const familyMember = masterData.familyMemberById.get(member.familyMemberId);
    if (!familyMember) {
      return toDeletedPersonCardData(member.familyMemberId, member);
    }
    return {
      id: familyMember.id,
      name: familyMember.name,
      grade: null,
      pickupLocationId: pickupLocationId ?? '',
      pickupLocationName,
      member,
    };
  }

  if (member.type === 'temporary') {
    const temporaryParticipant = masterData.responseByFamilyId
      .get(member.familyId)
      ?.temporaryParticipants?.find((t) => t.id === member.temporaryParticipantId);
    if (!temporaryParticipant) {
      // 一時参加者はマスタを持たず、Response.temporaryParticipants[]の項目自体が実体である。
      // 削除（×ボタン）はマスタの物理削除と同じ「情報が失われる」操作のため、
      // 他の種別と同様に「（削除済み）」の人カードを返す（nullで無言消去しない）
      return toDeletedPersonCardData(member.temporaryParticipantId, member);
    }
    return {
      id: temporaryParticipant.id,
      name: temporaryParticipant.name,
      grade: null,
      pickupLocationId: pickupLocationId ?? '',
      pickupLocationName,
      member,
    };
  }

  const coach = masterData.coachById.get(member.coachId);
  if (!coach) {
    return toDeletedPersonCardData(member.coachId, member);
  }
  return {
    id: coach.id,
    name: coach.name,
    grade: null,
    pickupLocationId: pickupLocationId ?? '',
    pickupLocationName,
    member,
  };
}

/**
 * 車カードの経由地一覧（集合場所名）を動的に算出する。
 * 運転者の集合場所を先頭とし、以降は乗車メンバーの並び順で重複を除いて追加する。
 * ref: docs/05_データ設計.md#10 経由地一覧（集合場所）
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
 * 対象方向において配車対象となる乗車メンバー（選手・コーチ・家族）一覧を算出する。
 * ref: docs/05_データ設計.md#10 type: "player" について・type: "coach" について・type: "family" について
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

    for (const familyMemberResponse of response.familyMembers ?? []) {
      const familyMemberMaster = masterData.familyMemberById.get(familyMemberResponse.familyMemberId);
      if (
        familyMemberMaster?.isActive &&
        familyMemberMaster.familyId === familyId &&
        isFamilyMemberRidingForDirection(familyMemberResponse, direction)
      ) {
        members.push({ type: 'family', familyMemberId: familyMemberResponse.familyMemberId });
      }
    }

    for (const coachResponse of response.coaches ?? []) {
      const coachMaster = masterData.coachById.get(coachResponse.coachId);
      if (
        coachMaster?.isActive &&
        coachMaster.familyId === familyId &&
        isCoachRidingForDirection(coachResponse, direction)
      ) {
        members.push({ type: 'coach', coachId: coachResponse.coachId });
      }
    }

    for (const temporaryParticipant of response.temporaryParticipants ?? []) {
      if (isTemporaryParticipantRidingForDirection(temporaryParticipant, direction)) {
        members.push({
          type: 'temporary',
          familyId,
          temporaryParticipantId: temporaryParticipant.id,
        });
      }
    }
  }

  return members;
}

/**
 * 対象方向において「参加かつ送迎不要」（配車不要エリアの対象）となる選手・コーチ・家族・一時参加者一覧を算出する。
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

    for (const familyMemberResponse of response.familyMembers ?? []) {
      const familyMemberMaster = masterData.familyMemberById.get(familyMemberResponse.familyMemberId);
      if (
        familyMemberMaster?.isActive &&
        familyMemberMaster.familyId === familyId &&
        isFamilyMemberNoRideNeededForDirection(familyMemberResponse, direction)
      ) {
        members.push({ type: 'family', familyMemberId: familyMemberResponse.familyMemberId });
      }
    }

    for (const coachResponse of response.coaches ?? []) {
      const coachMaster = masterData.coachById.get(coachResponse.coachId);
      if (
        coachMaster?.isActive &&
        coachMaster.familyId === familyId &&
        isCoachNoRideNeededForDirection(coachResponse, direction)
      ) {
        members.push({ type: 'coach', coachId: coachResponse.coachId });
      }
    }

    for (const temporaryParticipant of response.temporaryParticipants ?? []) {
      if (isTemporaryParticipantNoRideNeededForDirection(temporaryParticipant, direction)) {
        members.push({
          type: 'temporary',
          familyId,
          temporaryParticipantId: temporaryParticipant.id,
        });
      }
    }
  }

  return members;
}

/** 乗車メンバー（player/coach/family/temporary）を一意に識別するキーを生成する（services/carpool/carpoolMember.tsのmemberKeyと同一基準） */
function memberKey(member: CarpoolMember): string {
  if (member.type === 'player') return `player:${member.playerId}`;
  if (member.type === 'family') return `family:${member.familyMemberId}`;
  if (member.type === 'temporary') return `temporary:${member.temporaryParticipantId}`;
  return `coach:${member.coachId}`;
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
  const [playersLists, coachesLists, familyMembersLists] = await Promise.all([
    Promise.all(families.map((family) => getPlayersByFamilyId(family.id))),
    Promise.all(families.map((family) => getCoachesByFamilyId(family.id))),
    Promise.all(families.map((family) => getFamilyMembersByFamilyId(family.id))),
  ]);

  const familyById = new Map(families.map((family) => [family.id, family]));
  const playerById = new Map(playersLists.flat().map((player) => [player.id, player]));
  const coachById = new Map(coachesLists.flat().map((coach) => [coach.id, coach]));
  const familyMemberById = new Map(
    familyMembersLists.flat().map((familyMember) => [familyMember.id, familyMember])
  );
  const responseByFamilyId = new Map(
    responses.map((response) => [response.familyId, response])
  );
  const pickupLocationById = new Map(
    pickupLocations.map((location) => [location.id, location])
  );

  return { familyById, playerById, coachById, familyMemberById, responseByFamilyId, pickupLocationById };
}

/**
 * イベント全体で「未回答」（isParticipatingが未選択）の選手・コーチ・家族の人数を算出する。
 * isParticipatingは方向（行き／帰り）に依存しない値のため、buildCarpoolBoardDataとは別の
 * 方向非依存の関数として提供する。一時参加者は未回答の状態を経由しない（追加時に常にisParticipating:
 * trueとなる）ため対象外とする（05_データ設計.md#9参照）。
 * ref: docs/02_要件定義.md#11 対応する例外, docs/07_配車アルゴリズム.md#6 例外系・境界条件設計
 */
export function countUnansweredPeople(masterData: BoardMasterData): number {
  let count = 0;

  for (const player of masterData.playerById.values()) {
    if (!player.isActive || !masterData.familyById.get(player.familyId)?.isActive) {
      continue;
    }
    const responsePlayer = masterData.responseByFamilyId
      .get(player.familyId)
      ?.players.find((p) => p.playerId === player.id);
    if (!responsePlayer || responsePlayer.isParticipating === null) {
      count++;
    }
  }

  for (const coach of masterData.coachById.values()) {
    if (!coach.isActive || !masterData.familyById.get(coach.familyId)?.isActive) {
      continue;
    }
    const responseCoach = masterData.responseByFamilyId
      .get(coach.familyId)
      ?.coaches?.find((c) => c.coachId === coach.id);
    if (!responseCoach || responseCoach.isParticipating === null) {
      count++;
    }
  }

  for (const familyMember of masterData.familyMemberById.values()) {
    if (!familyMember.isActive || !masterData.familyById.get(familyMember.familyId)?.isActive) {
      continue;
    }
    const responseFamilyMember = masterData.responseByFamilyId
      .get(familyMember.familyId)
      ?.familyMembers?.find((f) => f.familyMemberId === familyMember.id);
    if (!responseFamilyMember || responseFamilyMember.isParticipating === null) {
      count++;
    }
  }

  return count;
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
      familyName: family?.familyName ?? null,
      capacity: carpool.capacity,
      routeLocationNames: buildRouteLocationNames(carpool, masterData),
      members: carpool.members
        .map((member) => toPersonCardData(member, masterData))
        .filter((person): person is PersonCardData => person !== null),
    };
  });

  return { unassignedPeople, noRideNeededPeople, carCards };
}
