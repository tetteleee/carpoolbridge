import { test, expect } from './utils/fixtures';
import {
  waitForDexieDb,
  seedPickupLocation,
  seedDestination,
  seedFamily,
  seedPlayer,
  seedEvent,
  getAllRecords,
} from './utils/seedDexie';

/**
 * イベント作成 → 回答入力 → 自動配車という一連のDexieRepository読み書きチェーンが
 * 通しで動くことを検証するE2Eテスト。
 * ref: docs/10_DexieRepository実装設計.md#8 公開版E2Eテスト設計
 * ref (自チーム版の対応するテスト): e2e/event-edit-carpool-create.spec.ts
 */
test('回答入力〜自動配車まで一連の流れが動作する', async ({ page }) => {
  // window.__dexieDbはアプリ読み込み後に利用可能になるため、先に一度画面を開く
  await page.goto('/');
  await waitForDexieDb(page);

  // 自動配車には集合場所・目的地の緯度経度登録が必須のため、両方に値を渡す
  const pickupLocationId = await seedPickupLocation(page, {
    name: '集合場所A',
    latitude: 35.0,
    longitude: 139.0,
  });
  const destinationId = await seedDestination(page, {
    name: '目的地A',
    latitude: 35.1,
    longitude: 139.1,
  });
  const familyId = await seedFamily(page, {
    familyName: '山田家',
    vehicleCapacity: 5,
    pickupLocationId,
  });
  const playerId = await seedPlayer(page, {
    familyId,
    name: '太郎',
    schoolEntryYear: 2020,
  });
  const eventId = await seedEvent(page, {
    name: '練習試合',
    date: '2026-08-01',
    destinationId,
  });

  await page.goto(`/events/${eventId}/edit`);
  await expect(page.locator(`#family-response-card-${familyId}`)).toBeVisible();

  // 初期状態は折りたたまれているため、ヘッダーをタップして展開する
  await page.click(`#family-response-card-header-${familyId}`);

  // 車出し（行き・帰りとも可）
  await page.click(`#driver-offer-${familyId}-both`);
  // 選手の参加回答
  await page.click(`#player-participating-yes-${playerId}`);

  await page.getByRole('button', { name: '自動配車', exact: true }).click();
  await page.waitForURL(`**/events/${eventId}/carpool`);
  await expect(page.getByText('読み込み中...')).toHaveCount(0);

  // 未配車エリアには残らず、車カード側に配置される
  await expect(page.getByRole('heading', { name: '未配車　0名' })).toBeVisible();
  await expect(page.getByText('太郎')).toBeVisible();

  // DexieRepository側にも正しく永続化されていることを直接確認する
  interface CarpoolRecord {
    eventId: string;
    direction: string;
    driverFamilyId: string;
    members: { type: string; playerId?: string }[];
  }
  const carpools = await getAllRecords<CarpoolRecord>(page, 'carpools');
  const outwardCarpools = carpools.filter((c) => c.eventId === eventId && c.direction === 'OUTWARD');
  expect(outwardCarpools).toHaveLength(1);
  expect(outwardCarpools[0].driverFamilyId).toBe(familyId);
  expect(outwardCarpools[0].members).toEqual([{ type: 'player', playerId }]);
});
