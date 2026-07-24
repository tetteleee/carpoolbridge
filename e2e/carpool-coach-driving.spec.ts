import { test, expect } from '@playwright/test';
import { Timestamp } from 'firebase-admin/firestore';
import { getEmulatorFirestore } from './utils/firebaseAdmin';

/**
 * コーチが運転する家庭の自動配車（コーチを通常の乗車メンバーとして扱う）を検証するE2Eテスト。
 * ref: docs/02_要件定義.md#コーチと車出し, docs/07_配車アルゴリズム.md#2.1
 */
test('コーチが運転する家庭は、コーチ自身も通常の乗車メンバーとして配車される（定員ぴったりでもHard Failしない）', async ({
  page,
}) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const pickupLocationRef = await db.collection('pickupLocations').add({
    name: '集合場所A', latitude: 35.0, longitude: 139.0,
  });
  const destinationRef = await db.collection('destinations').add({
    name: '目的地A', latitude: 35.1, longitude: 139.1,
  });

  // コーチ+子供1人でちょうど定員2。旧仕様（運転者分を無条件で-1）ではHard Failしていたケース
  const familyRef = await db.collection('families').add({
    familyName: '佐藤家', coachName: '佐藤父', vehicleCapacity: 2, pickupLocationId: pickupLocationRef.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const childRef = await db.collection('children').add({
    familyId: familyRef.id, name: '佐藤太郎', schoolEntryYear: 2020, isActive: true, createdAt: now, updatedAt: now,
  });
  const eventRef = await db.collection('events').add({
    name: '練習試合', date: '2026-08-01', destinationId: destinationRef.id, createdAt: now, updatedAt: now,
  });
  await eventRef.collection('responses').doc(familyRef.id).set({
    driverOutward: true, driverReturn: true, capacityToday: null, coachParticipating: true, remarks: '',
    children: [{ childId: childRef.id, isParticipating: true, noOutwardRide: false, noReturnRide: false }],
  });

  await page.goto(`/events/${eventRef.id}/edit`);
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
  await expect(page.locator(`#family-response-card-${familyRef.id}`)).toBeVisible();

  await page.getByRole('button', { name: '配車作成' }).click();
  await page.waitForURL(`**/events/${eventRef.id}/carpool`);
  await expect(page.getByText('読み込み中...')).toHaveCount(0);

  // Hard Failしていない（配車画面へ遷移し、警告バナーも出ない）ことを確認
  await expect(page.getByRole('alert')).toHaveCount(0);

  // コーチ自身が通常の乗車メンバーとしてCarpool.membersに含まれることをFirestoreで確認
  const outwardSnapshot = await eventRef
    .collection('carpools')
    .where('direction', '==', 'OUTWARD')
    .get();
  expect(outwardSnapshot.docs).toHaveLength(1);
  const outwardData = outwardSnapshot.docs[0].data();
  expect(outwardData.members).toContainEqual({ type: 'coach', familyId: familyRef.id });
  expect(outwardData.members).toContainEqual({ type: 'child', childId: childRef.id });
  expect(outwardData).not.toHaveProperty('driverIsCoach');

  // 画面上でも佐藤父が通常の人カードとして佐藤号の中に表示され、乗車率が2/2（3/2にならない）
  const carCard = page.locator('[data-drop-zone-id]').filter({ hasText: '佐藤号' });
  await expect(carCard.getByText('佐藤父')).toBeVisible();
  await expect(carCard.getByText('2/2')).toBeVisible();
});

test('コーチのみで満席の場合、子供が乗れずHard Failし、エラー文言に「-1名」を含まない', async ({ page }) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const pickupLocationRef = await db.collection('pickupLocations').add({
    name: '集合場所A', latitude: 35.0, longitude: 139.0,
  });
  const destinationRef = await db.collection('destinations').add({
    name: '目的地A', latitude: 35.1, longitude: 139.1,
  });

  // 定員1（コーチのみでぴったり）なのに子供が1人いるため、優先割り当てグループが定員超過する
  const familyRef = await db.collection('families').add({
    familyName: '佐藤家', coachName: '佐藤父', vehicleCapacity: 1, pickupLocationId: pickupLocationRef.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const childRef = await db.collection('children').add({
    familyId: familyRef.id, name: '佐藤太郎', schoolEntryYear: 2020, isActive: true, createdAt: now, updatedAt: now,
  });
  const eventRef = await db.collection('events').add({
    name: '練習試合', date: '2026-08-01', destinationId: destinationRef.id, createdAt: now, updatedAt: now,
  });
  await eventRef.collection('responses').doc(familyRef.id).set({
    driverOutward: true, driverReturn: true, capacityToday: null, coachParticipating: true, remarks: '',
    children: [{ childId: childRef.id, isParticipating: true, noOutwardRide: false, noReturnRide: false }],
  });

  await page.goto(`/events/${eventRef.id}/edit`);
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
  await expect(page.locator(`#family-response-card-${familyRef.id}`)).toBeVisible();

  await page.getByRole('button', { name: '配車作成' }).click();

  const errorMessage = page.getByText('様の優先割り当て人数（同乗必須メンバー数）が、車両の有効定員を超過しています');
  await expect(errorMessage).toBeVisible();
  await expect(page.getByText('-1名')).toHaveCount(0);
  await expect(page.getByText('(車両定員')).toHaveCount(0);
  expect(page.url()).toContain(`/events/${eventRef.id}/edit`);
});
