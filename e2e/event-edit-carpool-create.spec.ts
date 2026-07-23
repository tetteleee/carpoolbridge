import { test, expect } from '@playwright/test';
import { Timestamp } from 'firebase-admin/firestore';
import { getEmulatorFirestore } from './utils/firebaseAdmin';

/**
 * イベント編集（回答入力）画面の「配車作成」ボタン・配車再作成確認ダイアログ（T30）を検証するE2Eテスト。
 */
test('配車作成ボタンと配車再作成確認ダイアログ', async ({ page }) => {
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
    coachName: null,
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
  await eventRef.collection('responses').doc(familyRef.id).set({
    driverOutward: true,
    driverReturn: true,
    capacityToday: null,
    coachParticipating: null,
    remarks: '',
    children: [
      { childId: childRef.id, isParticipating: true, noOutwardRide: false, noReturnRide: false },
    ],
  });

  await page.goto(`/events/${eventRef.id}/edit`);
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();

  await expect(page.locator(`#family-response-card-${familyRef.id}`)).toBeVisible();

  const carpoolsCollection = eventRef.collection('carpools');

  // 既存の配車結果が存在しない場合：確認ダイアログを表示せず配車を作成し、配車画面（メイン）へ遷移する
  await page.getByRole('button', { name: '配車作成' }).click();
  await page.waitForURL(`**/events/${eventRef.id}/carpool`);
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);

  await expect.poll(async () => (await carpoolsCollection.get()).size).toBe(2);
  const firstOutwardSnapshot = await carpoolsCollection
    .where('direction', '==', 'OUTWARD')
    .get();
  const firstOutwardId = firstOutwardSnapshot.docs[0].id;

  // 既存の配車結果が存在する場合：再作成確認ダイアログを表示する
  await page.goto(`/events/${eventRef.id}/edit`);
  await expect(page.locator(`#family-response-card-${familyRef.id}`)).toBeVisible();
  await page.getByRole('button', { name: '配車作成' }).click();
  await expect(page.getByRole('heading', { name: '配車を再作成' })).toBeVisible();
  await expect(page.getByText('現在の配車結果は削除されます。')).toBeVisible();

  // 「キャンセル」選択時：配車結果は変更されず、画面遷移も発生しない
  await page.getByRole('button', { name: 'キャンセル' }).click();
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  expect((await carpoolsCollection.get()).size).toBe(2);
  expect(page.url()).toContain(`/events/${eventRef.id}/edit`);

  // 「再作成」選択時：既存の配車結果を削除し、最新の回答内容を基に配車を再作成したうえで配車画面（メイン）へ遷移する
  await page.getByRole('button', { name: '配車作成' }).click();
  await page.getByRole('button', { name: '再作成' }).click();
  await page.waitForURL(`**/events/${eventRef.id}/carpool`);

  await expect.poll(async () => (await carpoolsCollection.get()).size).toBe(2);
  const secondOutwardSnapshot = await carpoolsCollection
    .where('direction', '==', 'OUTWARD')
    .get();
  expect(secondOutwardSnapshot.docs[0].id).not.toBe(firstOutwardId);
});
