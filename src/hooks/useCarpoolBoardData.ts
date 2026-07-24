import { useEffect, useMemo, useState } from 'react';
import type { CarCardData } from '../components/carpool/CarCard';
import type { UnassignedPerson } from '../components/carpool/UnassignedArea';
import type { PersonCardData } from '../components/carpool/PersonCard';
import { getFamilies } from '../services/master/familyService';
import { getChildrenByFamilyId } from '../services/master/childService';
import { getPickupLocations } from '../services/master/pickupLocationService';
import { getResponses } from '../services/event/responseService';
import { isChildRidingForDirection } from '../services/carpool/eligibility';
import { memberKey } from '../services/carpool/carpoolMember';
import { getSchoolGrade } from '../utils/schoolGrade';
import type { Carpool, CarpoolMember, Direction, Response } from '../types/event';
import type { Child, Family, PickupLocation } from '../types/master';

interface UseCarpoolBoardDataResult {
  /** 選択中タブ（行き／帰り）の未配車の人カード一覧 */
  unassignedPeople: UnassignedPerson[];
  /** 選択中タブ（行き／帰り）の車カード一覧 */
  carCards: CarCardData[];
  /** マスタ・回答データの取得中かどうか */
  loading: boolean;
  /** マスタ・回答データの取得に失敗した場合のエラーメッセージ */
  error: string | null;
}

/** 表示用データ変換に必要なマスタ・回答データ */
interface BoardMasterData {
  familyById: Map<string, Family>;
  childById: Map<string, Child>;
  responseByFamilyId: Map<string, Response>;
  pickupLocationById: Map<string, PickupLocation>;
}

/** 学年表記（例：「小4」）を生成する。対象学年外の場合はnullを返す */
function toGradeLabel(schoolEntryYear: number): string | null {
  const grade = getSchoolGrade(schoolEntryYear);
  return grade === null ? null : `小${grade}`;
}

/** 家庭に参加するコーチが紐づいているかどうか（車出し可否に関わらず判定） */
function hasParticipatingCoach(family: Family | undefined, response: Response | undefined): boolean {
  return !!family && family.coachName !== null && response?.coachParticipating === true;
}

/** 乗車メンバー（CarpoolMember）の集合場所IDを取得する。対応するマスタが見つからない場合はnull */
function getMemberPickupLocationId(
  member: CarpoolMember,
  masterData: BoardMasterData
): string | null {
  const familyId = member.type === 'child'
    ? masterData.childById.get(member.childId)?.familyId
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

  if (member.type === 'child') {
    const child = masterData.childById.get(member.childId);
    if (!child) {
      return null;
    }
    return {
      id: child.id,
      name: child.name,
      grade: toGradeLabel(child.schoolEntryYear),
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
 * 対象方向において配車対象となる乗車メンバー（子供・コーチ）一覧を算出する。
 * ref: docs/05_データ設計.md#9 type: "child" について・type: "coach" について
 */
function buildEligibleMembers(masterData: BoardMasterData, direction: Direction): CarpoolMember[] {
  const members: CarpoolMember[] = [];

  for (const [familyId, response] of masterData.responseByFamilyId) {
    const family = masterData.familyById.get(familyId);
    if (!family || !family.isActive) {
      continue;
    }

    for (const child of response.children) {
      const childMaster = masterData.childById.get(child.childId);
      if (
        childMaster?.isActive &&
        childMaster.familyId === familyId &&
        isChildRidingForDirection(child, direction)
      ) {
        members.push({ type: 'child', childId: child.childId });
      }
    }

    if (hasParticipatingCoach(family, response)) {
      members.push({ type: 'coach', familyId });
    }
  }

  return members;
}

/**
 * 配車画面（メイン）の未配車エリア・車カードに表示する実データを算出するフック。
 * ref: docs/04_画面設計.md#8 未配車エリア・車カード, docs/05_データ設計.md#8,#9
 *
 * T20のCarpool読み取り処理・マスタデータ（Family・Child・PickupLocation）・回答（Response）を
 * 突き合わせ、選択中タブ（行き／帰り）の未配車人数・人カード一覧と、車カードごとの
 * 乗車メンバー・乗車率・巡回集合場所を算出する。
 *
 * @param eventId 対象のイベントID
 * @param direction 選択中タブ（行き／帰り）
 * @param carpools 選択中タブの配車結果（T20経由で取得済みのもの）
 */
export function useCarpoolBoardData(
  eventId: string | undefined,
  direction: Direction,
  carpools: Carpool[]
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
        const childrenLists = await Promise.all(
          families.map((family) => getChildrenByFamilyId(family.id))
        );
        if (ignore) {
          return;
        }

        const familyById = new Map(families.map((family) => [family.id, family]));
        const childById = new Map(
          childrenLists.flat().map((child) => [child.id, child])
        );
        const responseByFamilyId = new Map(
          responses.map((response) => [response.familyId, response])
        );
        const pickupLocationById = new Map(
          pickupLocations.map((location) => [location.id, location])
        );

        setMasterData({ familyById, childById, responseByFamilyId, pickupLocationById });
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
        expectedCoachPersonId: hasParticipatingCoach(family, response) ? (family as Family).id : null,
        members: carpool.members
          .map((member) => toPersonCardData(member, masterData))
          .filter((person): person is PersonCardData => person !== null),
      };
    });
  }, [masterData, carpools]);

  return { unassignedPeople, carCards, loading, error };
}
