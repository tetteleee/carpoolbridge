import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { firestorePaths } from '../../constants';
import { createPickupLocation } from '../master/pickupLocationService';
import { createDestination } from '../master/destinationService';
import { createFamily } from '../master/familyService';
import { createChild } from '../master/childService';
import { getSchoolEntryYearOptions } from '../../utils/schoolGrade';
import type { Destination, PickupLocation } from '../../types/master';

const SAMPLE_PICKUP_LOCATIONS: Omit<PickupLocation, 'id'>[] = [
  { name: '中央公園', latitude: 35.6895, longitude: 139.6917 },
  { name: 'ひまわり幼稚園前', latitude: 35.6812, longitude: 139.7671 },
  { name: 'けやき駅前', latitude: 35.6586, longitude: 139.7454 },
];

const SAMPLE_DESTINATIONS: Omit<Destination, 'id'>[] = [
  { name: '市民球場', latitude: 35.7023, longitude: 139.7745 },
  { name: '河川敷グラウンド', latitude: 35.6702, longitude: 139.7016 },
];

interface SampleChild {
  name: string;
  /** getSchoolEntryYearOptions() のインデックス */
  gradeIndex: number;
  /** 集合場所を家庭の基本集合場所と別にする場合のみ、SAMPLE_PICKUP_LOCATIONS のインデックスを指定 */
  pickupLocationOverrideIndex: number | null;
}

interface SampleFamily {
  familyName: string;
  coachName: string | null;
  vehicleCapacity: number;
  /** SAMPLE_PICKUP_LOCATIONS のインデックス */
  pickupLocationIndex: number;
  children: SampleChild[];
}

const SAMPLE_FAMILIES: SampleFamily[] = [
  {
    familyName: '佐藤家',
    coachName: '佐藤太郎',
    vehicleCapacity: 4,
    pickupLocationIndex: 0,
    children: [
      { name: '佐藤一郎', gradeIndex: 5, pickupLocationOverrideIndex: null },
      { name: '佐藤花子', gradeIndex: 2, pickupLocationOverrideIndex: 2 },
    ],
  },
  {
    familyName: '鈴木家',
    coachName: null,
    vehicleCapacity: 5,
    pickupLocationIndex: 1,
    children: [{ name: '鈴木健太', gradeIndex: 4, pickupLocationOverrideIndex: null }],
  },
  {
    familyName: '田中家',
    coachName: null,
    vehicleCapacity: 0,
    pickupLocationIndex: 2,
    children: [
      { name: '田中美咲', gradeIndex: 1, pickupLocationOverrideIndex: null },
      { name: '田中大輔', gradeIndex: 3, pickupLocationOverrideIndex: null },
    ],
  },
  {
    familyName: '高橋家',
    coachName: '高橋次郎',
    vehicleCapacity: 6,
    pickupLocationIndex: 0,
    children: [{ name: '高橋さくら', gradeIndex: 0, pickupLocationOverrideIndex: null }],
  },
  {
    familyName: '伊藤家',
    coachName: null,
    vehicleCapacity: 4,
    pickupLocationIndex: 1,
    children: [
      { name: '伊藤翔太', gradeIndex: 5, pickupLocationOverrideIndex: null },
      { name: '伊藤陽菜', gradeIndex: 2, pickupLocationOverrideIndex: null },
    ],
  },
];

const DELETE_BATCH_SIZE = 400;

/**
 * 指定コレクション配下の全ドキュメントを物理削除します。
 */
async function deleteAllDocsInCollection(collectionPath: string): Promise<void> {
  const colRef = collection(db, collectionPath);
  const snapshot = await getDocs(colRef);
  const docs = snapshot.docs;

  for (let i = 0; i < docs.length; i += DELETE_BATCH_SIZE) {
    const batch = writeBatch(db);
    docs.slice(i, i + DELETE_BATCH_SIZE).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

/**
 * 開発環境限定の「サンプルデータ投入」機能。
 *
 * 既存の集合場所・目的地・家庭・子供を全削除したうえで、評価・動作確認用の
 * サンプルデータを登録する。
 *
 * 家庭・子供の物理削除は、通常の運用では行わない例外的な操作（docs/05_データ設計.md
 * 「11. 削除方針」の例外を参照）であり、本機能以外からは呼び出さないこと。
 */
export async function seedSampleData(): Promise<void> {
  await deleteAllDocsInCollection(firestorePaths.childrenCollection());
  await deleteAllDocsInCollection(firestorePaths.familiesCollection());
  await deleteAllDocsInCollection(firestorePaths.pickupLocationsCollection());
  await deleteAllDocsInCollection(firestorePaths.destinationsCollection());

  const pickupLocationIds = await Promise.all(
    SAMPLE_PICKUP_LOCATIONS.map((location) => createPickupLocation(location))
  );
  await Promise.all(
    SAMPLE_DESTINATIONS.map((destination) => createDestination(destination))
  );

  const schoolEntryYearOptions = getSchoolEntryYearOptions();

  for (const family of SAMPLE_FAMILIES) {
    const familyId = await createFamily({
      familyName: family.familyName,
      coachName: family.coachName,
      vehicleCapacity: family.vehicleCapacity,
      pickupLocationId: pickupLocationIds[family.pickupLocationIndex],
    });

    for (const child of family.children) {
      await createChild({
        familyId,
        name: child.name,
        schoolEntryYear: schoolEntryYearOptions[child.gradeIndex],
        pickupLocationOverride:
          child.pickupLocationOverrideIndex === null
            ? null
            : pickupLocationIds[child.pickupLocationOverrideIndex],
      });
    }
  }
}
