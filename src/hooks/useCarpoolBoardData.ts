import { useEffect, useMemo, useState } from 'react';
import type { CarCardData } from '../components/carpool/CarCard';
import type { UnassignedPerson } from '../components/carpool/UnassignedArea';
import type { PersonCardData } from '../components/carpool/PersonCard';
import { getFamilies } from '../services/master/familyService';
import { getPlayersByFamilyId } from '../services/master/playerService';
import { getPickupLocations } from '../services/master/pickupLocationService';
import { getResponses } from '../services/event/responseService';
import {
  isPlayerNoRideNeededForDirection,
  isPlayerRidingForDirection,
  isCoachParticipating,
  type EligibilityMasterData,
} from '../services/carpool/eligibility';
import { reconcileIneligibleMembers } from '../services/carpool/reconcileCarpoolMembers';
import { memberKey } from '../services/carpool/carpoolMember';
import { getSchoolGrade } from '../utils/schoolGrade';
import type { Carpool, CarpoolMember, Direction } from '../types/event';
import type { Family, PickupLocation } from '../types/master';

interface UseCarpoolBoardDataResult {
  /** 選択中タブ（行き／帰り）の未配車の人カード一覧 */
  unassignedPeople: UnassignedPerson[];
  /** 選択中タブ（行き／帰り）の配車不要（参加かつ送迎不要）の人カード一覧 */
  noRideNeededPeople: PersonCardData[];
  /** 選択中タブ（行き／帰り）の車カード一覧 */
  carCards: CarCardData[];
  /** 対象イベントの回答が1件もないかどうか（一部家庭のみ未回答の場合は含まない） */
  hasNoResponses: boolean;
  /** マスタ・回答データの取得中かどうか */
  loading: boolean;
  /** マスタ・回答データの取得に失敗した場合のエラーメッセージ */
  error: string | null;
}

/** 表示用データ変換に必要なマスタ・回答データ */
interface BoardMasterData extends EligibilityMasterData {
  pickupLocationById: Map<string, PickupLocation>;
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
    ? (masterData.pickupLocationById.get(pickupLocationId)?.name ?? '')
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

  return locationIds.map((locationId) => masterData.pickupLocationById.get(locationId)?.name ?? '');
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

    if (isCoachParticipating(family, response)) {
      members.push({ type: 'coach', familyId });
    }
  }

  return members;
}

/**
 * 対象方向において「参加かつ送迎不要」（配車不要エリアの対象）となる選手一覧を算出する。
 * コーチには送迎要否の概念がないため対象外とする。
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
  }

  return members;
}

/**
 * 配車画面（メイン）の未配車エリア・車カードに表示する実データを算出するフック。
 * ref: docs/04_画面設計.md#8 未配車エリア・車カード, docs/05_データ設計.md#8,#9
 *
 * T20のCarpool読み取り処理・マスタデータ（Family・Player・PickupLocation）・回答（Response）を
 * 突き合わせ、選択中タブ（行き／帰り）の未配車人数・人カード一覧と、車カードごとの
 * 乗車メンバー・乗車率・巡回集合場所を算出する。
 *
 * @param eventId 対象のイベントID
 * @param direction 選択中タブ（行き／帰り）
 * @param carpools 選択中タブの配車結果（T20経由で取得済みのもの）
 * @param onCarpoolsReconciled 回答変更により対象外になったメンバーをCarpoolから取り除いた場合に呼び出す
 *   （呼び出し側でcarpoolsを再取得させ、除去結果を画面へ反映させるために使用する）
 */
export function useCarpoolBoardData(
  eventId: string | undefined,
  direction: Direction,
  carpools: Carpool[],
  onCarpoolsReconciled: () => void
): UseCarpoolBoardDataResult {
  const [masterData, setMasterData] = useState<BoardMasterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      return;
    }

    let ignore = false;

    Promise.resolve()
      .then(() => {
        setLoading(true);
        setError(null);
        return Promise.all([getFamilies(), getResponses(eventId), getPickupLocations()]);
      })
      .then(async ([families, responses, pickupLocations]) => {
        const playersLists = await Promise.all(
          families.map((family) => getPlayersByFamilyId(family.id))
        );
        if (ignore) {
          return;
        }

        const familyById = new Map(families.map((family) => [family.id, family]));
        const playerById = new Map(
          playersLists.flat().map((player) => [player.id, player])
        );
        const responseByFamilyId = new Map(
          responses.map((response) => [response.familyId, response])
        );
        const pickupLocationById = new Map(
          pickupLocations.map((location) => [location.id, location])
        );

        setMasterData({ familyById, playerById, responseByFamilyId, pickupLocationById });
      })
      .catch(() => {
        if (!ignore) {
          setError('配車画面のデータ取得に失敗しました');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [eventId]);

  /**
   * 回答変更後の配車結果自動整合（回答編集画面で不参加等に変更された人を、
   * 配車画面を開いたタイミングでCarpoolから自動的に取り除く）。
   * ref: 04_画面設計.md#8 配車画面（メイン）
   */
  useEffect(() => {
    if (!eventId || !masterData || carpools.length === 0) {
      return;
    }

    let ignore = false;

    reconcileIneligibleMembers(eventId, direction, carpools, masterData).then((changed) => {
      if (!ignore && changed) {
        onCarpoolsReconciled();
      }
    });

    return () => {
      ignore = true;
    };
  }, [eventId, direction, carpools, masterData, onCarpoolsReconciled]);

  const unassignedPeople = useMemo<UnassignedPerson[]>(() => {
    if (!masterData) {
      return [];
    }

    const assignedKeys = new Set(
      carpools.flatMap((carpool) => carpool.members).map(memberKey)
    );

    return buildEligibleMembers(masterData, direction)
      .filter((member) => !assignedKeys.has(memberKey(member)))
      .map((member) => toPersonCardData(member, masterData))
      .filter((person): person is PersonCardData => person !== null);
  }, [masterData, carpools, direction]);

  const noRideNeededPeople = useMemo<PersonCardData[]>(() => {
    if (!masterData) {
      return [];
    }

    return buildNoRideNeededMembers(masterData, direction)
      .map((member) => toPersonCardData(member, masterData))
      .filter((person): person is PersonCardData => person !== null);
  }, [masterData, direction]);

  const carCards = useMemo<CarCardData[]>(() => {
    if (!masterData) {
      return [];
    }

    return carpools.map((carpool) => {
      const family = masterData.familyById.get(carpool.driverFamilyId);
      const response = masterData.responseByFamilyId.get(carpool.driverFamilyId);
      return {
        id: carpool.id,
        familyName: family?.familyName ?? '',
        capacity: carpool.capacity,
        routeLocationNames: buildRouteLocationNames(carpool, masterData),
        expectedCoachPersonId: isCoachParticipating(family, response) ? (family as Family).id : null,
        members: carpool.members
          .map((member) => toPersonCardData(member, masterData))
          .filter((person): person is PersonCardData => person !== null),
      };
    });
  }, [masterData, carpools]);

  const hasNoResponses = masterData !== null && masterData.responseByFamilyId.size === 0;

  return { unassignedPeople, noRideNeededPeople, carCards, hasNoResponses, loading, error };
}
