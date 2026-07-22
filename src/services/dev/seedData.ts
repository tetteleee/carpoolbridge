/**
 * 開発用テストデータ定義。
 *
 * docs/05_データ設計.md のコレクション構成に合わせて定義する。
 * 「サンプルデータ投入」ボタン（seedSampleData.ts）と `npm run seed`（scripts/seed/seed.ts）の
 * 両方から参照される、テストデータの唯一の定義元。
 *
 * ドキュメントIDはすべて固定値とする。両者ともこのIDでset()（上書き）するため、
 * どちらの経路で投入しても同じドキュメントIDの家族が生成される。
 *
 * Firestoreのデータ構造が変わった場合は、このファイルのみを更新すればよい構成とする。
 */
import { getSchoolEntryYearOptions } from '../../utils/schoolGrade';

// schoolEntryYearは実行日を基準に算出されるため、実行日に関わらず常に同じ値になるよう
// 基準日を固定する（未来永劫「今日」を基準にすると再実行のたびに学年がずれてしまうため）。
const GRADE_REFERENCE_DATE = new Date('2026-04-01');

// インデックス0〜5がそれぞれ小学1〜6年生に対応するschoolEntryYear
const SCHOOL_ENTRY_YEAR_BY_GRADE = getSchoolEntryYearOptions(GRADE_REFERENCE_DATE);

export interface SeedPickupLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface SeedDestination {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface SeedFamily {
  id: string;
  familyName: string;
  coachName: string | null;
  vehicleCapacity: number;
  pickupLocationId: string;
  isActive: boolean;
}

export interface SeedChild {
  id: string;
  familyId: string;
  name: string;
  /** 小学1〜6年生（0〜5）で指定する。実際のschoolEntryYearへの変換はこのファイル内で行う */
  grade: number;
  pickupLocationOverride: string | null;
  isActive: boolean;
}

export interface SeedEvent {
  id: string;
  name: string;
  date: string;
  destinationId: string;
}

export const PICKUP_LOCATIONS: SeedPickupLocation[] = [
  { id: 'location-chuo-koen', name: '中央公園', latitude: 35.6895, longitude: 139.6917 },
  {
    id: 'location-himawari-youchien',
    name: 'ひまわり幼稚園前',
    latitude: 35.6812,
    longitude: 139.7671,
  },
  { id: 'location-keyaki-ekimae', name: 'けやき駅前', latitude: 35.6586, longitude: 139.7454 },
  { id: 'location-sakura-danchi', name: 'さくら団地前', latitude: 35.695, longitude: 139.7005 },
];

export const DESTINATIONS: SeedDestination[] = [
  { id: 'destination-shimin-kyujo', name: '市民球場', latitude: 35.7023, longitude: 139.7745 },
  {
    id: 'destination-kasen-ground',
    name: '河川敷グラウンド',
    latitude: 35.6702,
    longitude: 139.7016,
  },
  {
    id: 'destination-tonari-shi-koen',
    name: '隣市総合運動公園',
    latitude: 35.715,
    longitude: 139.68,
  },
];

export const FAMILIES: SeedFamily[] = [
  {
    id: 'family-sato',
    familyName: '佐藤家',
    coachName: '佐藤太郎',
    vehicleCapacity: 4,
    pickupLocationId: 'location-chuo-koen',
    isActive: true,
  },
  {
    id: 'family-suzuki',
    familyName: '鈴木家',
    coachName: null,
    vehicleCapacity: 5,
    pickupLocationId: 'location-keyaki-ekimae',
    isActive: true,
  },
  {
    id: 'family-tanaka',
    familyName: '田中家',
    coachName: null,
    // 車を持たない家庭のサンプル
    vehicleCapacity: 0,
    pickupLocationId: 'location-himawari-youchien',
    isActive: true,
  },
  {
    id: 'family-takahashi',
    familyName: '高橋家',
    coachName: '高橋次郎',
    vehicleCapacity: 6,
    pickupLocationId: 'location-chuo-koen',
    isActive: true,
  },
  {
    id: 'family-ito',
    familyName: '伊藤家',
    coachName: null,
    vehicleCapacity: 4,
    pickupLocationId: 'location-keyaki-ekimae',
    isActive: true,
  },
  {
    id: 'family-watanabe',
    familyName: '渡辺家',
    coachName: null,
    vehicleCapacity: 5,
    pickupLocationId: 'location-himawari-youchien',
    isActive: true,
  },
  {
    id: 'family-yamamoto',
    familyName: '山本家',
    coachName: null,
    vehicleCapacity: 4,
    pickupLocationId: 'location-chuo-koen',
    isActive: true,
  },
  {
    id: 'family-nakamura',
    familyName: '中村家',
    coachName: null,
    vehicleCapacity: 4,
    pickupLocationId: 'location-keyaki-ekimae',
    // 卒団済み（論理削除）のサンプル。一覧画面等でisActive=falseが除外されることの確認用
    isActive: false,
  },
];

export const CHILDREN: SeedChild[] = [
  {
    id: 'child-sato-ichiro',
    familyId: 'family-sato',
    name: '佐藤一郎',
    grade: 6,
    pickupLocationOverride: null,
    isActive: true,
  },
  {
    id: 'child-sato-hanako',
    familyId: 'family-sato',
    name: '佐藤花子',
    grade: 3,
    // 集合場所を家庭の基本集合場所と別にするサンプル
    pickupLocationOverride: 'location-sakura-danchi',
    isActive: true,
  },
  {
    id: 'child-suzuki-kenta',
    familyId: 'family-suzuki',
    name: '鈴木健太',
    grade: 5,
    pickupLocationOverride: null,
    isActive: true,
  },
  {
    id: 'child-suzuki-yuki',
    familyId: 'family-suzuki',
    name: '鈴木優希',
    grade: 2,
    pickupLocationOverride: null,
    isActive: true,
  },
  {
    id: 'child-tanaka-misaki',
    familyId: 'family-tanaka',
    name: '田中美咲',
    grade: 2,
    pickupLocationOverride: null,
    isActive: true,
  },
  {
    id: 'child-tanaka-daisuke',
    familyId: 'family-tanaka',
    name: '田中大輔',
    grade: 4,
    pickupLocationOverride: null,
    isActive: true,
  },
  {
    id: 'child-takahashi-sakura',
    familyId: 'family-takahashi',
    name: '高橋さくら',
    grade: 1,
    pickupLocationOverride: null,
    isActive: true,
  },
  {
    id: 'child-takahashi-ryo',
    familyId: 'family-takahashi',
    name: '高橋涼',
    grade: 4,
    pickupLocationOverride: null,
    isActive: true,
  },
  {
    id: 'child-takahashi-mio',
    familyId: 'family-takahashi',
    name: '高橋美緒',
    grade: 6,
    pickupLocationOverride: null,
    isActive: true,
  },
  {
    id: 'child-ito-shota',
    familyId: 'family-ito',
    name: '伊藤翔太',
    grade: 6,
    pickupLocationOverride: null,
    isActive: true,
  },
  {
    id: 'child-ito-hina',
    familyId: 'family-ito',
    name: '伊藤陽菜',
    grade: 3,
    pickupLocationOverride: null,
    isActive: true,
  },
  {
    id: 'child-watanabe-ren',
    familyId: 'family-watanabe',
    name: '渡辺蓮',
    grade: 1,
    pickupLocationOverride: null,
    isActive: true,
  },
  {
    id: 'child-watanabe-aoi',
    familyId: 'family-watanabe',
    name: '渡辺葵',
    grade: 3,
    pickupLocationOverride: null,
    isActive: true,
  },
  {
    id: 'child-watanabe-yuma',
    familyId: 'family-watanabe',
    name: '渡辺悠真',
    grade: 5,
    pickupLocationOverride: null,
    isActive: true,
  },
  {
    id: 'child-yamamoto-kaito',
    familyId: 'family-yamamoto',
    name: '山本海斗',
    grade: 2,
    pickupLocationOverride: null,
    isActive: true,
  },
  {
    id: 'child-yamamoto-riko',
    familyId: 'family-yamamoto',
    name: '山本莉子',
    grade: 4,
    pickupLocationOverride: null,
    isActive: true,
  },
  {
    id: 'child-nakamura-taiga',
    familyId: 'family-nakamura',
    name: '中村大雅',
    grade: 6,
    pickupLocationOverride: null,
    // 家庭の卒団に連動して子供も論理削除される想定のサンプル
    isActive: false,
  },
];

export const EVENTS: SeedEvent[] = [
  {
    id: 'event-2026-06-14-practice',
    name: '練習',
    date: '2026-06-14',
    destinationId: 'destination-kasen-ground',
  },
  {
    id: 'event-2026-07-23-practice',
    name: '練習',
    date: '2026-07-23',
    destinationId: 'destination-kasen-ground',
  },
  {
    id: 'event-2026-08-02-game-a',
    name: '練習試合（Aチーム）',
    date: '2026-08-02',
    destinationId: 'destination-shimin-kyujo',
  },
  {
    id: 'event-2026-08-16-game-b',
    name: '練習試合（Bチーム）',
    date: '2026-08-16',
    destinationId: 'destination-tonari-shi-koen',
  },
  {
    id: 'event-2026-08-30-practice',
    name: '練習',
    date: '2026-08-30',
    destinationId: 'destination-kasen-ground',
  },
];

/**
 * 小学1〜6年生（grade）からschoolEntryYearへ変換する。
 */
export function schoolEntryYearOf(grade: number): number {
  return SCHOOL_ENTRY_YEAR_BY_GRADE[grade - 1];
}
