import { test, expect } from '@playwright/test';
import { Timestamp } from 'firebase-admin/firestore';
import { getEmulatorFirestore } from './utils/firebaseAdmin';

/**
 * イベント編集（回答入力）画面の自動保存（T29）を検証するE2Eテスト。
 * 「保存」ボタンを使わず、各入力項目の変更が即座にFirestoreへ反映されることを確認する。
 */
test('回答入力画面の各項目を変更すると、都度Firestoreへ自動保存される', async ({ page }) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const pickupLocationRef = await db.collection('pickupLocations').add({
    name: '集合場所A',
    latitude: 35.0,
    longitude: 139.0,
  });
  const destinationRef = await db.collection('destinations').add({
    name: '目的地A',
    latitude: 35.1,
    longitude: 139.1,
  });
  const familyRef = await db.collection('families').add({
    familyName: '山田家',
    coachName: '山田父',
    vehicleCapacity: 5,
    pickupLocationId: pickupLocationRef.id,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  const childRef = await db.collection('children').add({
    familyId: familyRef.id,
    name: '太郎',
    schoolEntryYear: 2020,
    pickupLocationOverride: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  const eventRef = await db.collection('events').add({
    name: '練習試合',
    date: '2026-08-01',
    destinationId: destinationRef.id,
    createdAt: now,
    updatedAt: now,
  });

  // 初回アクセス時は未登録のため利用申請画面が表示される
  await page.goto(`/events/${eventRef.id}/edit`);
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  expect(uid).toBeTruthy();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();

  await expect(page.locator(`#family-response-card-${familyRef.id}`)).toBeVisible();

  const responseDocRef = eventRef.collection('responses').doc(familyRef.id);

  // 「保存」ボタンが存在しないことを確認する
  await expect(page.getByRole('button', { name: '保存' })).toHaveCount(0);

  // 1件目の変更（車出し・行き）でResponseドキュメントが新規作成される
  await page.click(`#driver-outward-${familyRef.id}-possible`);
  await expect
    .poll(async () => (await responseDocRef.get()).exists)
    .toBe(true);

  let saved = (await responseDocRef.get()).data();
  expect(saved?.driverOutward).toBe(true);
  expect(saved?.driverReturn).toBeNull();
  expect(saved?.capacityToday).toBeNull();
  expect(saved?.coachParticipating).toBeNull();
  expect(saved?.remarks).toBe('');
  expect(saved?.children).toEqual([
    { childId: childRef.id, isParticipating: null, noOutwardRide: false, noReturnRide: false },
  ]);

  // 2件目以降の変更は既存ドキュメントの部分更新となり、他の項目は保持される
  await page.click(`#child-participating-yes-${childRef.id}`);
  await expect
    .poll(async () => (await responseDocRef.get()).data()?.children)
    .toEqual([
      { childId: childRef.id, isParticipating: true, noOutwardRide: false, noReturnRide: false },
    ]);
  saved = (await responseDocRef.get()).data();
  expect(saved?.driverOutward).toBe(true);

  await page.click(`#no-outward-ride-${childRef.id}`);
  await expect
    .poll(async () => (await responseDocRef.get()).data()?.children)
    .toEqual([
      { childId: childRef.id, isParticipating: true, noOutwardRide: true, noReturnRide: false },
    ]);

  await page.click(`#coach-participating-yes-${familyRef.id}`);
  await expect
    .poll(async () => (await responseDocRef.get()).data()?.coachParticipating)
    .toBe(true);

  await page.fill(`#remarks-input-${familyRef.id}`, '雨天時は現地集合');
  await expect
    .poll(async () => (await responseDocRef.get()).data()?.remarks)
    .toBe('雨天時は現地集合');

  // 乗車可能人数（ステッパー）の変更も反映される
  await page.click(`#capacity-today-increment-${familyRef.id}`);
  await expect
    .poll(async () => (await responseDocRef.get()).data()?.capacityToday)
    .toBe(6);

  // リロード後も自動保存済みの内容が初期表示に反映される（「戻る」後の再訪と同等の確認）
  await page.reload();
  await expect(page.locator(`#driver-outward-${familyRef.id}-possible`)).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await expect(page.locator(`#child-participating-yes-${childRef.id}`)).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await expect(page.locator(`#no-outward-ride-${childRef.id}`)).toBeChecked();
  await expect(page.locator(`#coach-participating-yes-${familyRef.id}`)).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await expect(page.locator(`#remarks-input-${familyRef.id}`)).toHaveValue('雨天時は現地集合');
  await expect(page.locator(`#capacity-today-value-${familyRef.id}`)).toHaveText('6');
});
