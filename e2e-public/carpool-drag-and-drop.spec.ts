import { test, expect } from './utils/fixtures';
import {
  waitForDexieDb,
  seedPickupLocation,
  seedDestination,
  seedFamily,
  seedPlayer,
  seedEvent,
  seedResponse,
  getAllRecords,
} from './utils/seedDexie';

/**
 * 配車結果画面のドラッグ&ドロップで、saveCarpoolsのupsert・原子性が
 * 実際に機能することを検証するE2Eテスト。
 * ref: docs/10_DexieRepository実装設計.md#8 公開版E2Eテスト設計
 * ref (自チーム版の対応するテスト): e2e/carpool-drag-and-drop.spec.ts
 */
test('未配車エリアの人カードを長押しドラッグして車カードへ移動し、リロード後も維持される', async ({
  page,
}) => {
  await page.goto('/');
  await waitForDexieDb(page);

  // 自動配車には集合場所・目的地の緯度経度登録が必須のため、両方に値を渡す
  const pickupLocationId = await seedPickupLocation(page, {
    name: '西公園',
    latitude: 35.0,
    longitude: 139.0,
  });
  const destinationId = await seedDestination(page, {
    name: '目的地A',
    latitude: 35.1,
    longitude: 139.1,
  });

  // 定員0（コーチなし）の車を出す家庭。乗車メンバーがいない間は自動配車の対象にならず、
  // 山田太郎は未配車のまま残る（未配車エリアからのドラッグ操作を検証するための前提）
  const familyDriverId = await seedFamily(page, {
    familyName: '鈴木家',
    vehicleCapacity: 0,
    pickupLocationId,
  });
  const familyRiderId = await seedFamily(page, {
    familyName: '山田家',
    vehicleCapacity: 0,
    pickupLocationId,
  });
  const playerRiderId = await seedPlayer(page, {
    familyId: familyRiderId,
    name: '山田太郎',
    schoolEntryYear: 2019,
  });

  const eventId = await seedEvent(page, {
    name: '練習試合',
    date: '2026-08-01',
    destinationId,
  });

  await seedResponse(page, {
    eventId,
    familyId: familyDriverId,
    driverOutward: true,
    driverReturn: true,
  });
  await seedResponse(page, {
    eventId,
    familyId: familyRiderId,
    driverOutward: false,
    driverReturn: false,
    players: [
      { playerId: playerRiderId, isParticipating: true, noOutwardRide: false, noReturnRide: false },
    ],
  });

  await page.goto(`/events/${eventId}/edit`);
  await expect(page.locator(`#family-response-card-${familyDriverId}`)).toBeVisible();
  await page.getByRole('button', { name: '自動配車', exact: true }).click();
  await page.waitForURL(`**/events/${eventId}/carpool`);
  await expect(page.getByText('読み込み中...')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '未配車　1名' })).toBeVisible();
  await expect(page.getByText('山田太郎')).toBeVisible();

  const personCard = page.getByText('山田太郎').locator('..');
  const carCard = page.locator('[data-drop-zone-id]').filter({ hasText: '鈴木号' });

  const personBox = await personCard.boundingBox();
  const carBox = await carCard.boundingBox();
  if (!personBox || !carBox) {
    throw new Error('bounding box not found');
  }

  const startX = personBox.x + personBox.width / 2;
  const startY = personBox.y + personBox.height / 2;
  const endX = carBox.x + carBox.width / 2;
  const endY = carBox.y + carBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  // 長押し判定（400ms）を超えて待機してからドラッグを開始する
  await page.waitForTimeout(600);
  await page.mouse.move((startX + endX) / 2, (startY + endY) / 2, { steps: 5 });
  await page.mouse.move(endX, endY, { steps: 5 });
  await page.mouse.up();

  await expect(page.getByRole('heading', { name: '未配車　0名' })).toBeVisible();

  // saveCarpoolsが移動元・移動先の両方を正しくupsertしたことを直接確認する
  interface CarpoolRecord {
    eventId: string;
    direction: string;
    driverFamilyId: string;
    members: { type: string; playerId?: string }[];
  }
  const carpools = await getAllRecords<CarpoolRecord>(page, 'carpools');
  const outwardCarpools = carpools.filter((c) => c.eventId === eventId && c.direction === 'OUTWARD');
  const driverCarpool = outwardCarpools.find((c) => c.driverFamilyId === familyDriverId);
  expect(driverCarpool?.members).toEqual([{ type: 'player', playerId: playerRiderId }]);

  // ページリロード後も移動結果がIndexedDBから正しく復元されることを確認する
  await page.reload();
  await expect(page.getByRole('heading', { name: '未配車　0名' })).toBeVisible();
  await expect(page.getByText('山田太郎')).toBeVisible();
});
