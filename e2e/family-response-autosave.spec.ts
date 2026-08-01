import { test, expect } from './utils/fixtures';
import { Timestamp } from 'firebase-admin/firestore';
import { getEmulatorFirestore } from './utils/firebaseAdmin';

/**
 * イベント編集（回答入力）画面における家族の回答欄を検証するE2Eテスト。
 * 選手・コーチと同じ自動保存の仕組みで、familyMembers[]へ反映されることを確認する。
 * ref: docs/04_画面設計.md#7, docs/05_データ設計.md#9 家族情報
 */

async function registerAsStaffAndReload(page: import('@playwright/test').Page, db: ReturnType<typeof getEmulatorFirestore>) {
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
}

test('家族が1人も登録されていない家庭では、家族の回答欄は表示されない', async ({ page }) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const pickupLocationRef = await db.collection('pickupLocations').add({
    name: '集合場所A', latitude: 35.0, longitude: 139.0,
  });
  const destinationRef = await db.collection('destinations').add({
    name: '目的地A', latitude: 35.1, longitude: 139.1,
  });
  const familyRef = await db.collection('families').add({
    familyName: '山田家', vehicleCapacity: 5, pickupLocationId: pickupLocationRef.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const eventRef = await db.collection('events').add({
    name: '練習試合', date: '2026-08-01', destinationId: destinationRef.id, createdAt: now, updatedAt: now,
  });

  await page.goto(`/events/${eventRef.id}/edit`);
  await registerAsStaffAndReload(page, db);
  await expect(page.locator(`#family-response-card-${familyRef.id}`)).toBeVisible();
  await page.click(`#family-response-card-header-${familyRef.id}`);

  await expect(page.getByText('家族')).toHaveCount(0);
});

test('家族の参加・行き／帰りの送迎要否の変更が、都度familyMembers[]へ自動保存される', async ({ page }) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const pickupLocationRef = await db.collection('pickupLocations').add({
    name: '集合場所A', latitude: 35.0, longitude: 139.0,
  });
  const destinationRef = await db.collection('destinations').add({
    name: '目的地A', latitude: 35.1, longitude: 139.1,
  });
  const familyRef = await db.collection('families').add({
    familyName: '山田家', vehicleCapacity: 5, pickupLocationId: pickupLocationRef.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const familyMemberRef = await db.collection('familyMembers').add({
    familyId: familyRef.id, name: '山田祖母', isActive: true, createdAt: now, updatedAt: now,
  });
  const eventRef = await db.collection('events').add({
    name: '練習試合', date: '2026-08-01', destinationId: destinationRef.id, createdAt: now, updatedAt: now,
  });

  await page.goto(`/events/${eventRef.id}/edit`);
  await registerAsStaffAndReload(page, db);
  await expect(page.locator(`#family-response-card-${familyRef.id}`)).toBeVisible();

  const responseDocRef = eventRef.collection('responses').doc(familyRef.id);

  await page.click(`#family-response-card-header-${familyRef.id}`);
  await expect(page.getByText('山田祖母')).toBeVisible();

  // 「参加」を○にした瞬間、行き・帰りの送迎スイッチは両方ON（送迎あり）になる
  await page.click(`#family-member-participating-yes-${familyMemberRef.id}`);
  await expect
    .poll(async () => (await responseDocRef.get()).data()?.familyMembers)
    .toEqual([
      { familyMemberId: familyMemberRef.id, isParticipating: true, noOutwardRide: false, noReturnRide: false },
    ]);

  // 他の項目（家庭情報側）と混在しても、familyMembers以外のフィールドは維持される
  const saved = (await responseDocRef.get()).data();
  expect(saved?.coaches).toEqual([]);
  expect(saved?.players).toEqual([]);

  // 行きの送迎スイッチをOFF（不要）にする
  await page.click(`#family-member-no-outward-ride-${familyMemberRef.id}`);
  await expect
    .poll(async () => (await responseDocRef.get()).data()?.familyMembers)
    .toEqual([
      { familyMemberId: familyMemberRef.id, isParticipating: true, noOutwardRide: true, noReturnRide: false },
    ]);

  // リロード後も自動保存済みの内容が初期表示に反映される
  await page.reload();
  await page.click(`#family-response-card-header-${familyRef.id}`);
  await expect(page.locator(`#family-member-participating-yes-${familyMemberRef.id}`)).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await expect(page.locator(`#family-member-no-outward-ride-${familyMemberRef.id}`)).toHaveAttribute(
    'aria-checked',
    'false'
  );
  await expect(page.locator(`#family-member-no-return-ride-${familyMemberRef.id}`)).toHaveAttribute(
    'aria-checked',
    'true'
  );
});

test('家族が複数人いる家庭では、1人ずつ独立して回答できる', async ({ page }) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const pickupLocationRef = await db.collection('pickupLocations').add({
    name: '集合場所A', latitude: 35.0, longitude: 139.0,
  });
  const destinationRef = await db.collection('destinations').add({
    name: '目的地A', latitude: 35.1, longitude: 139.1,
  });
  const familyRef = await db.collection('families').add({
    familyName: '渡辺家', vehicleCapacity: 5, pickupLocationId: pickupLocationRef.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const memberA = await db.collection('familyMembers').add({
    familyId: familyRef.id, name: '渡辺祖父', isActive: true, createdAt: now, updatedAt: now,
  });
  const memberB = await db.collection('familyMembers').add({
    familyId: familyRef.id, name: '渡辺妹', isActive: true, createdAt: now, updatedAt: now,
  });
  const eventRef = await db.collection('events').add({
    name: '練習試合', date: '2026-08-01', destinationId: destinationRef.id, createdAt: now, updatedAt: now,
  });

  await page.goto(`/events/${eventRef.id}/edit`);
  await registerAsStaffAndReload(page, db);
  await expect(page.locator(`#family-response-card-${familyRef.id}`)).toBeVisible();
  await page.click(`#family-response-card-header-${familyRef.id}`);

  const responseDocRef = eventRef.collection('responses').doc(familyRef.id);

  await page.click(`#family-member-participating-yes-${memberA.id}`);
  await page.click(`#family-member-participating-no-${memberB.id}`);

  await expect.poll(async () => {
    const familyMembers = (await responseDocRef.get()).data()?.familyMembers as
      | { familyMemberId: string; isParticipating: boolean | null }[]
      | undefined;
    return familyMembers?.find((f) => f.familyMemberId === memberA.id)?.isParticipating;
  }).toBe(true);

  await expect.poll(async () => {
    const familyMembers = (await responseDocRef.get()).data()?.familyMembers as
      | { familyMemberId: string; isParticipating: boolean | null }[]
      | undefined;
    return familyMembers?.find((f) => f.familyMemberId === memberB.id)?.isParticipating;
  }).toBe(false);
});
