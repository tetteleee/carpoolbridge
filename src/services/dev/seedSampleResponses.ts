import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { firestorePaths } from '../../constants';
import { getFamilies } from '../master/familyService';
import { getAllPlayers } from '../master/playerService';
import { getAllCoaches } from '../master/coachService';
import { getAllFamilyMembers } from '../master/familyMemberService';
import { deleteAllResponses } from '../event/responseService';
import type { Response, ResponseCoach, ResponseFamilyMember, ResponsePlayer } from '../../types/event';

/** 備考のサンプル文言（一定確率で空文字も選ばれるようにし、未入力のケースも再現する） */
const SAMPLE_REMARKS = ['', '', '', '本日は妹も同乗します', '集合場所を変更希望', '早退の可能性あり'];

/** 未選択（null）・可（true）・不可（false）の3択からランダムに1つ返す */
function randomTriState(): boolean | null {
  const r = Math.random();
  if (r < 1 / 3) return null;
  if (r < 2 / 3) return true;
  return false;
}

function randomRemarks(): string {
  return SAMPLE_REMARKS[Math.floor(Math.random() * SAMPLE_REMARKS.length)];
}

/**
 * 当日乗車可能人数（capacityToday）をランダムに生成する。
 * 大半は未変更（null）とし、一部のみ0〜通常定員の範囲で上書きする。
 */
function randomCapacityToday(vehicleCapacity: number): number | null {
  if (Math.random() < 0.7) {
    return null;
  }
  return Math.floor(Math.random() * (vehicleCapacity + 1));
}

/**
 * 車出し可否（driverOutward・driverReturn）を、画面上の4択
 * （可／不可／行きのみ／帰りのみ、いずれも未回答の場合はnull）からランダムに1つ選び生成する。
 * 画面設計（04_画面設計.md#7）の制約に合わせ、当日の乗車可能人数が0人の場合は
 * 運転が発生する選択肢（可／行きのみ／帰りのみ）を選ばないようにする。
 */
function randomDriverOffer(effectiveCapacity: number): { driverOutward: boolean | null; driverReturn: boolean | null } {
  if (effectiveCapacity <= 0) {
    const r = Math.random();
    if (r < 0.5) return { driverOutward: null, driverReturn: null };
    return { driverOutward: false, driverReturn: false };
  }

  const options: { driverOutward: boolean | null; driverReturn: boolean | null }[] = [
    { driverOutward: null, driverReturn: null },
    { driverOutward: true, driverReturn: true },
    { driverOutward: false, driverReturn: false },
    { driverOutward: true, driverReturn: false },
    { driverOutward: false, driverReturn: true },
  ];
  return options[Math.floor(Math.random() * options.length)];
}

/** 送迎不要（例外）が発生する確率。現地集合・保護者お迎え等は稀なケースのため低めに設定する */
const NO_RIDE_PROBABILITY = 0.15;

function randomResponsePlayer(playerId: string): ResponsePlayer {
  const isParticipating = randomTriState();
  // 送迎要否スイッチは「参加」が○の場合のみ意味を持つため、それ以外は既定値（送迎あり＝false）のままにする
  if (isParticipating !== true) {
    return { playerId, isParticipating, noOutwardRide: false, noReturnRide: false };
  }
  return {
    playerId,
    isParticipating,
    noOutwardRide: Math.random() < NO_RIDE_PROBABILITY,
    noReturnRide: Math.random() < NO_RIDE_PROBABILITY,
  };
}

/** コーチ個別のランダム回答を生成する。選手（randomResponsePlayer）と全く同じロジック */
function randomResponseCoach(coachId: string): ResponseCoach {
  const isParticipating = randomTriState();
  if (isParticipating !== true) {
    return { coachId, isParticipating, noOutwardRide: false, noReturnRide: false };
  }
  return {
    coachId,
    isParticipating,
    noOutwardRide: Math.random() < NO_RIDE_PROBABILITY,
    noReturnRide: Math.random() < NO_RIDE_PROBABILITY,
  };
}

/** 家族個別のランダム回答を生成する。選手（randomResponsePlayer）と全く同じロジック */
function randomResponseFamilyMember(familyMemberId: string): ResponseFamilyMember {
  const isParticipating = randomTriState();
  if (isParticipating !== true) {
    return { familyMemberId, isParticipating, noOutwardRide: false, noReturnRide: false };
  }
  return {
    familyMemberId,
    isParticipating,
    noOutwardRide: Math.random() < NO_RIDE_PROBABILITY,
    noReturnRide: Math.random() < NO_RIDE_PROBABILITY,
  };
}

/**
 * 家庭・選手のマスタデータを基に、1家庭分のランダムな回答を生成する。
 *
 * @param vehicleCapacity 対象家庭の通常定員（Family.vehicleCapacity）
 * @param playerIds 対象家庭に属する有効な選手IDの一覧
 * @param coachIds 対象家庭に属する有効なコーチIDの一覧
 * @param familyMemberIds 対象家庭に属する有効な家族IDの一覧
 */
function buildRandomResponse(
  vehicleCapacity: number,
  playerIds: string[],
  coachIds: string[],
  familyMemberIds: string[]
): Response {
  const capacityToday = randomCapacityToday(vehicleCapacity);
  const effectiveCapacity = capacityToday ?? vehicleCapacity;
  const { driverOutward, driverReturn } = randomDriverOffer(effectiveCapacity);

  return {
    driverOutward,
    driverReturn,
    capacityToday,
    remarks: randomRemarks(),
    players: playerIds.map((playerId) => randomResponsePlayer(playerId)),
    coaches: coachIds.map((coachId) => randomResponseCoach(coachId)),
    familyMembers: familyMemberIds.map((familyMemberId) =>
      randomResponseFamilyMember(familyMemberId)
    ),
    // 一時参加者（今回だけ参加する人）はマスタに存在しないため、サンプル生成の対象外とする
    temporaryParticipants: [],
  };
}

/**
 * 開発環境限定の「サンプル回答生成」機能（04_画面設計.md#7 開発用機能）。
 *
 * 対象イベントの既存回答（Response）をすべて削除したうえで、登録済みの
 * 家庭・選手等のマスタデータ（在籍中のもののみ）を基に、ランダムな回答を
 * 生成・登録する。実行のたびにランダム性により結果が変わり得る。
 *
 * 回答の物理削除は、通常の運用では行わない例外的な操作（05_データ設計.md
 * 「11. 削除方針」の例外を参照）であり、本機能以外からは呼び出さないこと。
 *
 * @param eventId 対象のイベントID
 */
export async function generateSampleResponses(eventId: string): Promise<void> {
  const families = await getFamilies();
  const activeFamilies = families.filter((family) => family.isActive);

  const [players, coaches, familyMembers] = await Promise.all([
    getAllPlayers(),
    getAllCoaches(),
    getAllFamilyMembers(),
  ]);

  const activePlayerIdsByFamilyId = new Map<string, string[]>();
  const activeCoachIdsByFamilyId = new Map<string, string[]>();
  const activeFamilyMemberIdsByFamilyId = new Map<string, string[]>();
  for (const player of players) {
    if (!player.isActive) continue;
    const ids = activePlayerIdsByFamilyId.get(player.familyId) ?? [];
    ids.push(player.id);
    activePlayerIdsByFamilyId.set(player.familyId, ids);
  }
  for (const coach of coaches) {
    if (!coach.isActive) continue;
    const ids = activeCoachIdsByFamilyId.get(coach.familyId) ?? [];
    ids.push(coach.id);
    activeCoachIdsByFamilyId.set(coach.familyId, ids);
  }
  for (const familyMember of familyMembers) {
    if (!familyMember.isActive) continue;
    const ids = activeFamilyMemberIdsByFamilyId.get(familyMember.familyId) ?? [];
    ids.push(familyMember.id);
    activeFamilyMemberIdsByFamilyId.set(familyMember.familyId, ids);
  }

  await deleteAllResponses(eventId);

  const batch = writeBatch(db);

  activeFamilies.forEach((family) => {
    const activePlayerIds = activePlayerIdsByFamilyId.get(family.id) ?? [];
    const activeCoachIds = activeCoachIdsByFamilyId.get(family.id) ?? [];
    const activeFamilyMemberIds = activeFamilyMemberIdsByFamilyId.get(family.id) ?? [];

    const response = buildRandomResponse(
      family.vehicleCapacity,
      activePlayerIds,
      activeCoachIds,
      activeFamilyMemberIds
    );

    batch.set(doc(db, firestorePaths.responseDocument(eventId, family.id)), response);
  });

  await batch.commit();
}
