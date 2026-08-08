/**
 * 自動配車アルゴリズムの統合関数（Response→Carpool生成・Firestore保存）
 * ref: docs/07_配車アルゴリズム.md（全体）, docs/05_データ設計.md#10 Carpool（配車結果）
 *
 * 指定イベント・指定方向（行き／帰り）のResponseデータを入力として、
 * 前処理（T33・T34）→割当（T35）→例外系ハンドリング（T36）を実行し、
 * 結果をCarpoolドキュメント形式へ変換してFirestoreへ保存する。
 */

import type { Carpool, Direction, Response } from '../../types/event';
import type { PickupLocation } from '../../types/master';
import { getFamilies } from '../master/familyService';
import { getAllPlayers } from '../master/playerService';
import { getAllCoaches } from '../master/coachService';
import { getAllFamilyMembers } from '../master/familyMemberService';
import { getPickupLocations } from '../master/pickupLocationService';
import { getResponses } from '../event/responseService';
import { createCarpool } from '../event/carpoolService';
import type { Location } from './scoring';
import type { DrivingCandidate, Passenger } from './preprocessing';
import {
  validatePickupLocations,
  initializeVehicles,
  formFamilyGroups,
  assignDriverFamilyGroups,
} from './preprocessing';
import { runAutoAssignment } from './assignmentAlgorithm';
import type { AssignmentHardFailError, AssignmentWarning } from './assignmentErrors';
import {
  MissingCoordinatesError,
  DriverGroupCapacityExceededError,
  buildAssignmentWarnings,
} from './assignmentErrors';
import {
  isDriverForDirection,
  isPlayerRidingForDirection,
  isCoachRidingForDirection,
  isFamilyMemberRidingForDirection,
  isTemporaryParticipantRidingForDirection,
} from './eligibility';

/**
 * runCarpoolAssignmentの戻り値。
 * Hard Failエラーが検出された場合はFirestoreへの保存を行わずにエラー内容を返す。
 * それ以外の場合は保存を実行し、保存したCarpoolのID一覧と警告一覧を返す
 * （警告が無い場合はwarningsは空配列）。
 */
export type RunCarpoolAssignmentResult =
  | { status: 'ERROR'; error: AssignmentHardFailError }
  | { status: 'SUCCESS'; carpoolIds: string[]; warnings: AssignmentWarning[] };

/** 家庭表示名を生成する（familyNameから末尾の「家」を除いた文字列。ref: 05_データ設計.md#3） */
function toFamilyDisplayName(familyName: string): string {
  return familyName.endsWith('家') ? familyName.slice(0, -1) : familyName;
}

/**
 * 指定イベント・指定方向のResponseデータから自動配車を実行し、
 * 結果をCarpoolドキュメントとしてFirestoreへ保存します。
 *
 * @param eventId 対象のイベントID
 * @param direction 対象方向（"OUTWARD"｜"RETURN"）
 * @returns 実行結果（Hard Failエラー、または保存済みCarpoolのID一覧・警告一覧）
 */
export async function runCarpoolAssignment(
  eventId: string,
  direction: Direction
): Promise<RunCarpoolAssignmentResult> {
  const [families, responses, pickupLocations] = await Promise.all([
    getFamilies(),
    getResponses(eventId),
    getPickupLocations(),
  ]);

  const activeFamilies = families.filter((family) => family.isActive);
  const responseByFamilyId = new Map(responses.map((r) => [r.familyId, r]));
  const answeredFamilies = activeFamilies.filter((family) =>
    responseByFamilyId.has(family.id)
  );
  const unansweredCount = activeFamilies.length - answeredFamilies.length;

  const [players, coaches, familyMembers] = await Promise.all([
    getAllPlayers(),
    getAllCoaches(),
    getAllFamilyMembers(),
  ]);
  const activePlayerIdsByFamilyId = new Map<string, Set<string>>(
    answeredFamilies.map((family) => [family.id, new Set<string>()])
  );
  const activeCoachIdsByFamilyId = new Map<string, Set<string>>(
    answeredFamilies.map((family) => [family.id, new Set<string>()])
  );
  const activeFamilyMemberIdsByFamilyId = new Map<string, Set<string>>(
    answeredFamilies.map((family) => [family.id, new Set<string>()])
  );
  for (const player of players) {
    if (player.isActive) {
      activePlayerIdsByFamilyId.get(player.familyId)?.add(player.id);
    }
  }
  for (const coach of coaches) {
    if (coach.isActive) {
      activeCoachIdsByFamilyId.get(coach.familyId)?.add(coach.id);
    }
  }
  for (const familyMember of familyMembers) {
    if (familyMember.isActive) {
      activeFamilyMemberIdsByFamilyId.get(familyMember.familyId)?.add(familyMember.id);
    }
  }

  const pickupLocationById = new Map(pickupLocations.map((location) => [location.id, location]));

  // 対象方向で実際に配車対象となる（＝車出しする、または乗車対象者が存在する）家庭の集合場所のみを
  // 緯度経度バリデーション対象とする（無関係な家庭の未登録データで処理を止めないため）
  const usedLocationIds = new Set<string>();
  const usedPickupLocations: PickupLocation[] = [];
  for (const family of answeredFamilies) {
    const response = responseByFamilyId.get(family.id) as Response;
    const activePlayerIds = activePlayerIdsByFamilyId.get(family.id) as Set<string>;
    const activeCoachIds = activeCoachIdsByFamilyId.get(family.id) as Set<string>;
    const activeFamilyMemberIds = activeFamilyMemberIdsByFamilyId.get(family.id) as Set<string>;
    const driving = isDriverForDirection(response, direction);
    const hasRidingPlayer = response.players.some(
      (player) => activePlayerIds.has(player.playerId) && isPlayerRidingForDirection(player, direction)
    );
    const hasRidingFamilyMember = (response.familyMembers ?? []).some(
      (familyMember) =>
        activeFamilyMemberIds.has(familyMember.familyMemberId) &&
        isFamilyMemberRidingForDirection(familyMember, direction)
    );
    const hasRidingCoach = (response.coaches ?? []).some(
      (coach) => activeCoachIds.has(coach.coachId) && isCoachRidingForDirection(coach, direction)
    );
    const hasRidingTemporaryParticipant = (response.temporaryParticipants ?? []).some(
      (temporaryParticipant) =>
        isTemporaryParticipantRidingForDirection(temporaryParticipant, direction)
    );

    const hasAnyRidingMember =
      driving ||
      hasRidingPlayer ||
      hasRidingFamilyMember ||
      hasRidingCoach ||
      hasRidingTemporaryParticipant;

    if (hasAnyRidingMember && !usedLocationIds.has(family.pickupLocationId)) {
      usedLocationIds.add(family.pickupLocationId);
      const location = pickupLocationById.get(family.pickupLocationId);
      if (location) {
        usedPickupLocations.push(location);
      }
    }
  }

  try {
    validatePickupLocations(usedPickupLocations);
  } catch (error) {
    if (error instanceof MissingCoordinatesError) {
      return { status: 'ERROR', error };
    }
    throw error;
  }

  const toLocation = (locationId: string): Location => {
    const location = pickupLocationById.get(locationId) as PickupLocation;
    return {
      latitude: location.latitude as number,
      longitude: location.longitude as number,
    };
  };

  const vehicleCapacityByFamilyId = new Map<string, number>();
  const candidates: DrivingCandidate[] = [];
  const passengers: Passenger[] = [];

  for (const family of answeredFamilies) {
    const response = responseByFamilyId.get(family.id) as Response;
    const activePlayerIds = activePlayerIdsByFamilyId.get(family.id) as Set<string>;
    const activeCoachIds = activeCoachIdsByFamilyId.get(family.id) as Set<string>;
    const activeFamilyMemberIds = activeFamilyMemberIdsByFamilyId.get(family.id) as Set<string>;
    const vehicleCapacity = response.capacityToday ?? family.vehicleCapacity;

    vehicleCapacityByFamilyId.set(family.id, vehicleCapacity);

    candidates.push({
      familyId: family.id,
      driverName: toFamilyDisplayName(family.familyName),
      vehicleCapacity,
      driverPickupLocationId: family.pickupLocationId,
      driverPickupLocation: toLocation(family.pickupLocationId),
      driverOutward: response.driverOutward,
      driverReturn: response.driverReturn,
    });

    for (const player of response.players) {
      if (activePlayerIds.has(player.playerId) && isPlayerRidingForDirection(player, direction)) {
        passengers.push({
          familyId: family.id,
          pickupLocationId: family.pickupLocationId,
          pickupLocation: toLocation(family.pickupLocationId),
          member: { type: 'player', playerId: player.playerId },
        });
      }
    }

    for (const familyMember of response.familyMembers ?? []) {
      if (
        activeFamilyMemberIds.has(familyMember.familyMemberId) &&
        isFamilyMemberRidingForDirection(familyMember, direction)
      ) {
        passengers.push({
          familyId: family.id,
          pickupLocationId: family.pickupLocationId,
          pickupLocation: toLocation(family.pickupLocationId),
          member: { type: 'family', familyMemberId: familyMember.familyMemberId },
        });
      }
    }

    for (const coach of response.coaches ?? []) {
      if (activeCoachIds.has(coach.coachId) && isCoachRidingForDirection(coach, direction)) {
        passengers.push({
          familyId: family.id,
          pickupLocationId: family.pickupLocationId,
          pickupLocation: toLocation(family.pickupLocationId),
          member: { type: 'coach', coachId: coach.coachId },
        });
      }
    }

    for (const temporaryParticipant of response.temporaryParticipants ?? []) {
      if (isTemporaryParticipantRidingForDirection(temporaryParticipant, direction)) {
        passengers.push({
          familyId: family.id,
          pickupLocationId: family.pickupLocationId,
          pickupLocation: toLocation(family.pickupLocationId),
          member: {
            type: 'temporary',
            familyId: family.id,
            temporaryParticipantId: temporaryParticipant.id,
          },
        });
      }
    }
  }

  let assignedVehicles;
  let unassignedList;
  try {
    const vehicles = initializeVehicles(candidates, direction);
    const groups = formFamilyGroups(passengers);
    const unassignedGroups = assignDriverFamilyGroups(vehicles, groups);
    ({ assignedVehicles, unassignedList } = runAutoAssignment(vehicles, unassignedGroups));
  } catch (error) {
    if (error instanceof DriverGroupCapacityExceededError) {
      return { status: 'ERROR', error };
    }
    throw error;
  }

  const warnings = buildAssignmentWarnings(unassignedList, unansweredCount);

  const carpoolDocs: Omit<Carpool, 'id'>[] = assignedVehicles.map((vehicle) => ({
    direction,
    driverFamilyId: vehicle.driverFamilyId,
    capacity: vehicleCapacityByFamilyId.get(vehicle.driverFamilyId) ?? 0,
    members: vehicle.members,
  }));

  const carpoolIds = await Promise.all(
    carpoolDocs.map((data) => createCarpool(eventId, data))
  );

  return { status: 'SUCCESS', carpoolIds, warnings };
}
