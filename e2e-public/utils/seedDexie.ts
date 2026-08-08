import type { Page } from '@playwright/test';

/**
 * window.__dexieDb（public-e2eビルドmode限定のデバッグフック。
 * src/repositories/dexie/db.ts参照）経由で、UI操作を介さずIndexedDBへ
 * 直接テストデータを投入するヘルパー群。
 * Firebase Admin SDKで直接Firestoreに書き込む自チーム版E2E（e2e/utils/firebaseAdmin.ts）に相当する。
 *
 * ref: docs/10_DexieRepository実装設計.md#8 公開版E2Eテスト設計
 */

/** window.__dexieDbの指定テーブルへ1件追加する */
async function addRecord(page: Page, table: string, record: Record<string, unknown>): Promise<void> {
  await page.evaluate(
    ([tableName, data]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- テスト専用のデバッグフック（window.__dexieDb）への動的アクセスのため
      return (window as any).__dexieDb[tableName as string].add(data);
    },
    [table, record] as const
  );
}

export interface SeedPickupLocationInput {
  name: string;
  latitude?: number | null;
  longitude?: number | null;
}

export async function seedPickupLocation(page: Page, input: SeedPickupLocationInput): Promise<string> {
  const id = crypto.randomUUID();
  await addRecord(page, 'pickupLocations', {
    id,
    latitude: null,
    longitude: null,
    ...input,
  });
  return id;
}

export interface SeedDestinationInput {
  name: string;
  latitude?: number | null;
  longitude?: number | null;
}

export async function seedDestination(page: Page, input: SeedDestinationInput): Promise<string> {
  const id = crypto.randomUUID();
  await addRecord(page, 'destinations', {
    id,
    latitude: null,
    longitude: null,
    ...input,
  });
  return id;
}

export interface SeedFamilyInput {
  familyName: string;
  vehicleCapacity: number;
  pickupLocationId: string;
}

export async function seedFamily(page: Page, input: SeedFamilyInput): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date();
  await addRecord(page, 'families', {
    id,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...input,
  });
  return id;
}

export interface SeedPlayerInput {
  familyId: string;
  name: string;
  schoolEntryYear: number;
}

export async function seedPlayer(page: Page, input: SeedPlayerInput): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date();
  await addRecord(page, 'players', {
    id,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...input,
  });
  return id;
}

export interface SeedCoachInput {
  familyId: string;
  name: string;
}

export async function seedCoach(page: Page, input: SeedCoachInput): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date();
  await addRecord(page, 'coaches', {
    id,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...input,
  });
  return id;
}

export interface SeedFamilyMemberInput {
  familyId: string;
  name: string;
}

export async function seedFamilyMember(page: Page, input: SeedFamilyMemberInput): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date();
  await addRecord(page, 'familyMembers', {
    id,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...input,
  });
  return id;
}

export interface SeedEventInput {
  name: string;
  /** "YYYY-MM-DD"形式 */
  date: string;
  destinationId: string;
}

export async function seedEvent(page: Page, input: SeedEventInput): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date();
  await addRecord(page, 'events', {
    id,
    createdAt: now,
    updatedAt: now,
    ...input,
  });
  return id;
}

/** window.__dexieDbの指定テーブルの全レコードを取得する（カスケード削除の確認等に使用） */
export async function getAllRecords<T = Record<string, unknown>>(page: Page, table: string): Promise<T[]> {
  return page.evaluate((tableName) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- テスト専用のデバッグフック（window.__dexieDb）への動的アクセスのため
    return (window as any).__dexieDb[tableName].toArray();
  }, table);
}
