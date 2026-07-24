import { test, expect } from '@playwright/test';
import { Timestamp } from 'firebase-admin/firestore';
import { getEmulatorFirestore } from './utils/firebaseAdmin';

/**
 * 配車画面（メイン）の人カード ドラッグ＆ドロップ（T43）を検証するE2Eテスト。
 */
test('未配車エリアの人カードを長押しドラッグして車カードへ移動する', async ({ page }) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const locA = await db.collection('pickupLocations').add({ name: '西公園', latitude: 35.0, longitude: 139.0 });
  const destinationRef = await db.collection('destinations').add({ name: '目的地A', latitude: 35.1, longitude: 139.1 });

  const familyDriver = await db.collection('families').add({
    familyName: '鈴木家', coachName: null, vehicleCapacity: 1, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });

  const familyRider = await db.collection('families').add({
    familyName: '山田家', coachName: null, vehicleCapacity: 0, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const childRider = await db.collection('children').add({
    familyId: familyRider.id, name: '山田太郎', schoolEntryYear: 2019, isActive: true, createdAt: now, updatedAt: now,
  });

  const eventRef = await db.collection('events').add({
    name: '練習試合', date: '2026-08-01', destinationId: destinationRef.id, createdAt: now, updatedAt: now,
  });

  await eventRef.collection('responses').doc(familyDriver.id).set({
    driverOutward: true, driverReturn: true, capacityToday: null, coachParticipating: null, remarks: '',
    children: [],
  });
  await eventRef.collection('responses').doc(familyRider.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, coachParticipating: null, remarks: '',
    children: [{ childId: childRider.id, isParticipating: true, noOutwardRide: false, noReturnRide: false }],
  });

  await page.goto(`/events/${eventRef.id}/edit`);
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
  await expect(page.locator(`#family-response-card-${familyDriver.id}`)).toBeVisible();
  await page.getByRole('button', { name: '配車作成' }).click();
  await page.waitForURL(`**/events/${eventRef.id}/carpool`);
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

  await expect(page.getByText('未配車')).toHaveCount(0);

  const carpoolsSnapshot = await eventRef.collection('carpools').where('direction', '==', 'OUTWARD').get();
  const carpool = carpoolsSnapshot.docs[0].data();
  expect(carpool.members).toEqual([{ type: 'child', childId: childRider.id }]);
});

test('人カードの短いタップはドラッグとして扱われない', async ({ page }) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const locA = await db.collection('pickupLocations').add({ name: '西公園', latitude: 35.0, longitude: 139.0 });
  const destinationRef = await db.collection('destinations').add({ name: '目的地A', latitude: 35.1, longitude: 139.1 });

  const familyRider = await db.collection('families').add({
    familyName: '山田家', coachName: null, vehicleCapacity: 0, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const childRider = await db.collection('children').add({
    familyId: familyRider.id, name: '山田太郎', schoolEntryYear: 2019, isActive: true, createdAt: now, updatedAt: now,
  });

  const eventRef = await db.collection('events').add({
    name: '練習試合', date: '2026-08-01', destinationId: destinationRef.id, createdAt: now, updatedAt: now,
  });
  await eventRef.collection('responses').doc(familyRider.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, coachParticipating: null, remarks: '',
    children: [{ childId: childRider.id, isParticipating: true, noOutwardRide: false, noReturnRide: false }],
  });

  await page.goto(`/events/${eventRef.id}/edit`);
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
  await expect(page.locator(`#family-response-card-${familyRider.id}`)).toBeVisible();
  await page.getByRole('button', { name: '配車作成' }).click();
  await page.waitForURL(`**/events/${eventRef.id}/carpool`);
  await expect(page.getByText('読み込み中...')).toHaveCount(0);
  await expect(page.getByText('未配車　1名')).toBeVisible();

  const personCard = page.getByText('山田太郎').locator('..');
  const box = await personCard.boundingBox();
  if (!box) throw new Error('no box');

  // 短いタップ（長押し閾値未満）：ドラッグは開始せず、未配車のまま
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(100);
  await page.mouse.up();
  await page.waitForTimeout(300);

  await expect(page.getByText('未配車　1名')).toBeVisible();

  const carpoolsSnapshot = await eventRef.collection('carpools').get();
  expect(carpoolsSnapshot.size).toBe(0);
});

test('人カードを別の集合場所の車へ移動すると、経由地一覧に新しい集合場所が反映される', async ({ page }) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const locA = await db.collection('pickupLocations').add({ name: '西公園', latitude: 35.0, longitude: 139.0 });
  const locB = await db.collection('pickupLocations').add({ name: '中央公園', latitude: 35.2, longitude: 139.2 });
  const destinationRef = await db.collection('destinations').add({ name: '目的地A', latitude: 35.1, longitude: 139.1 });

  const familyDriver = await db.collection('families').add({
    familyName: '鈴木家', coachName: null, vehicleCapacity: 2, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });

  const familyRider = await db.collection('families').add({
    familyName: '山田家', coachName: null, vehicleCapacity: 0, pickupLocationId: locB.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const childRider = await db.collection('children').add({
    familyId: familyRider.id, name: '山田太郎', schoolEntryYear: 2019, isActive: true, createdAt: now, updatedAt: now,
  });

  const eventRef = await db.collection('events').add({
    name: '練習試合', date: '2026-08-01', destinationId: destinationRef.id, createdAt: now, updatedAt: now,
  });

  await eventRef.collection('responses').doc(familyDriver.id).set({
    driverOutward: true, driverReturn: true, capacityToday: null, coachParticipating: null, remarks: '',
    children: [],
  });
  await eventRef.collection('responses').doc(familyRider.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, coachParticipating: null, remarks: '',
    children: [{ childId: childRider.id, isParticipating: true, noOutwardRide: false, noReturnRide: false }],
  });

  // 鈴木号（西公園始発・定員2）に誰も乗っていない状態を直接作成する。山田太郎（中央公園）は未配車のまま
  await eventRef.collection('carpools').add({
    direction: 'OUTWARD',
    driverFamilyId: familyDriver.id,
    driverIsCoach: false,
    capacity: 2,
    members: [],
  });

  await page.goto(`/events/${eventRef.id}/carpool`);
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
  await expect(page.getByText('読み込み中...')).toHaveCount(0);

  const carCard = page.locator('[data-drop-zone-id]').filter({ hasText: '鈴木号' });

  // 移動前：車カードの経由地一覧には運転者の集合場所（西公園）のみが表示され、中央公園は含まれない
  const routeArea = carCard.locator('div').first();
  await expect(routeArea.getByText('西公園')).toBeVisible();
  await expect(carCard.getByText('中央公園')).toHaveCount(0);

  const personCard = page.getByText('山田太郎').locator('..');
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
  await page.waitForTimeout(600);
  await page.mouse.move((startX + endX) / 2, (startY + endY) / 2, { steps: 5 });
  await page.mouse.move(endX, endY, { steps: 5 });
  await page.mouse.up();

  // 移動後：山田太郎の集合場所（中央公園）が車カードの経由地一覧に反映される
  await expect(routeArea.getByText('中央公園')).toBeVisible();
});
