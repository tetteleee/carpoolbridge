import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { firestorePaths } from '../../constants';
import { getFamilies } from '../master/familyService';
import { getChildrenByFamilyId } from '../master/childService';
import { deleteAllResponses } from '../event/responseService';
import type { Response, ResponseChild } from '../../types/event';

/** 備考のサンプル文言（一定確率で空文字も選ばれるようにし、未入力のケースも再現する） */
const SAMPLE_REMARKS = ['', '', '', '本日は妹も同乗します', '集合場所を変更希望', '早退の可能性あり'];

/** 未選択（null）・可（true）・不可（false）の3択からランダムに1つ返す */
function randomTriState(): boolean | null {
  const r = Math.random();
  if (r < 1 / 3) return null;
  if (r < 2 / 3) return true;
  return false;
}

function randomBoolean(): boolean {
  return Math.random() < 0.5;
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
 * 車出し可否（driverOutward・driverReturn）をランダムに生成する。
 * 画面設計（04_画面設計.md#7）の制約に合わせ、当日の乗車可能人数が0人の場合は
 * 「可」を選ばないようにする。
 */
function randomDriverField(effectiveCapacity: number): boolean | null {
  const value = randomTriState();
  if (value === true && effectiveCapacity <= 0) {
    return false;
  }
  return value;
}

function randomResponseChild(childId: string): ResponseChild {
  return {
    childId,
    isParticipating: randomTriState(),
    noOutwardRide: randomBoolean(),
    noReturnRide: randomBoolean(),
  };
}

/**
 * 家庭・子供のマスタデータを基に、1家庭分のランダムな回答を生成する。
 *
 * @param vehicleCapacity 対象家庭の通常定員（Family.vehicleCapacity）
 * @param hasCoach 対象家庭にコーチが紐づくか（coachNameが設定されているか）
 * @param childIds 対象家庭に属する有効な子供IDの一覧
 */
function buildRandomResponse(
  vehicleCapacity: number,
  hasCoach: boolean,
  childIds: string[]
): Response {
  const capacityToday = randomCapacityToday(vehicleCapacity);
  const effectiveCapacity = capacityToday ?? vehicleCapacity;

  return {
    driverOutward: randomDriverField(effectiveCapacity),
    driverReturn: randomDriverField(effectiveCapacity),
    capacityToday,
    coachParticipating: hasCoach ? randomTriState() : null,
    remarks: randomRemarks(),
    children: childIds.map((childId) => randomResponseChild(childId)),
  };
}

/**
 * 開発環境限定の「サンプル回答生成」機能（04_画面設計.md#7 開発用機能）。
 *
 * 対象イベントの既存回答（Response）をすべて削除したうえで、登録済みの
 * 家庭・子供等のマスタデータ（在籍中のもののみ）を基に、ランダムな回答を
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

  const childrenByFamily = await Promise.all(
    activeFamilies.map((family) => getChildrenByFamilyId(family.id))
  );

  await deleteAllResponses(eventId);

  const batch = writeBatch(db);

  activeFamilies.forEach((family, index) => {
    const activeChildIds = childrenByFamily[index]
      .filter((child) => child.isActive)
      .map((child) => child.id);

    const response = buildRandomResponse(
      family.vehicleCapacity,
      family.coachName !== null,
      activeChildIds
    );

    batch.set(doc(db, firestorePaths.responseDocument(eventId, family.id)), response);
  });

  await batch.commit();
}
