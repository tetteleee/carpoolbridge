import { test, expect } from '@playwright/test';
import { Timestamp } from 'firebase-admin/firestore';
import { getEmulatorFirestore } from './utils/firebaseAdmin';

/**
 * 回答編集画面での車出し可否変更後の配車結果自動整合処理を検証するE2Eテスト。
 * 配車画面を開いたタイミングで、車出し可否の変更に応じて車が自動的に
 * 追加・削除されることを確認する。
 * ref: docs/04_画面設計.md#8 画面を開いた際の自動整合
 */
test('車出し可否の変更に応じて車が自動的に削除・追加され、重複作成されない', async ({ page }) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const locA = await db.collection('pickupLocations').add({ name: '西公園', latitude: 35.0, longitude: 139.0 });
  const destinationRef = await db.collection('destinations').add({ name: '目的地A', latitude: 35.1, longitude: 139.1 });

  // 可→不可に変更済みの家庭（既存の車が削除され、乗員は未配車になることを確認する対象）
  const familyRemoved = await db.collection('families').add({
    familyName: '鈴木家', coachName: null, vehicleCapacity: 4, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });

  // familyRemovedの車に乗っていた乗客（車が削除された後、未配車になることを確認する対象）
  const familyRider = await db.collection('families').add({
    familyName: '中村家', coachName: null, vehicleCapacity: 0, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const playerRider = await db.collection('players').add({
    familyId: familyRider.id, name: '中村太郎', schoolEntryYear: 2019, isActive: true, createdAt: now, updatedAt: now,
  });

  // 不可→可（行きのみ）に変更済みの家庭（新規に空の車が作成されることを確認する対象。capacityToday未設定のためvehicleCapacityを使用）
  const familyAdded = await db.collection('families').add({
    familyName: '山田家', coachName: null, vehicleCapacity: 3, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });

  // 既に可・既に車が存在する家庭（重複作成されないことを確認する対象）
  const familyExisting = await db.collection('families').add({
    familyName: '田中家', coachName: null, vehicleCapacity: 5, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });

  const eventRef = await db.collection('events').add({
    name: '練習試合', date: '2026-08-01', destinationId: destinationRef.id, createdAt: now, updatedAt: now,
  });

  // 可→不可に変更済み
  await eventRef.collection('responses').doc(familyRemoved.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, coachParticipating: null, remarks: '',
    players: [],
  });
  await eventRef.collection('responses').doc(familyRider.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, coachParticipating: null, remarks: '',
    players: [{ playerId: playerRider.id, isParticipating: true, noOutwardRide: false, noReturnRide: false }],
  });
  // 不可→可（行きのみ）に変更済み。帰りは不可のまま
  await eventRef.collection('responses').doc(familyAdded.id).set({
    driverOutward: true, driverReturn: false, capacityToday: null, coachParticipating: null, remarks: '',
    players: [],
  });
  await eventRef.collection('responses').doc(familyExisting.id).set({
    driverOutward: true, driverReturn: true, capacityToday: null, coachParticipating: null, remarks: '',
    players: [],
  });

  const removedCarRef = await eventRef.collection('carpools').add({
    direction: 'OUTWARD',
    driverFamilyId: familyRemoved.id,
    capacity: 4,
    members: [{ type: 'player', playerId: playerRider.id }],
  });
  const existingCarRef = await eventRef.collection('carpools').add({
    direction: 'OUTWARD',
    driverFamilyId: familyExisting.id,
    capacity: 5,
    members: [],
  });

  await page.goto(`/events/${eventRef.id}/carpool`);
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
  await expect(page.getByText('読み込み中...')).toHaveCount(0);

  // 鈴木号（可→不可）は表示されなくなり、乗っていた中村太郎は未配車になる
  await expect(page.locator('[data-drop-zone-id]').filter({ hasText: '鈴木号' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '未配車　1名' })).toBeVisible();
  await expect(page.getByText('中村太郎')).toBeVisible();

  // 山田号（不可→可）が新規に空の車として表示される
  await expect(page.locator('[data-drop-zone-id]').filter({ hasText: '山田号' })).toBeVisible();

  // Firestore側の検証
  await expect.poll(async () => (await removedCarRef.get()).exists).toBe(false);

  await expect.poll(async () => {
    const snapshot = await eventRef.collection('carpools')
      .where('direction', '==', 'OUTWARD')
      .where('driverFamilyId', '==', familyAdded.id)
      .get();
    return snapshot.docs.length;
  }).toBe(1);
  const addedCarSnapshot = await eventRef.collection('carpools')
    .where('direction', '==', 'OUTWARD')
    .where('driverFamilyId', '==', familyAdded.id)
    .get();
  expect(addedCarSnapshot.docs[0].data()).toMatchObject({ capacity: 3, members: [] });

  // 帰り方向は「行きのみ」のため、山田家の車は作成されない
  const returnCars = await eventRef.collection('carpools')
    .where('direction', '==', 'RETURN')
    .where('driverFamilyId', '==', familyAdded.id)
    .get();
  expect(returnCars.docs.length).toBe(0);

  // 既に車がある田中家は重複作成されない
  const existingCars = await eventRef.collection('carpools')
    .where('direction', '==', 'OUTWARD')
    .where('driverFamilyId', '==', familyExisting.id)
    .get();
  expect(existingCars.docs.length).toBe(1);
  expect(existingCars.docs[0].id).toBe(existingCarRef.id);
});
