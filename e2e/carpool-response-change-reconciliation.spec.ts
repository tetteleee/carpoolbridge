import { test, expect } from '@playwright/test';
import { Timestamp } from 'firebase-admin/firestore';
import { getEmulatorFirestore } from './utils/firebaseAdmin';

/**
 * 回答変更後の配車結果自動整合処理を検証するE2Eテスト。
 * 配車作成後に回答が「不参加」等に変更された場合、配車画面を開いたタイミングで
 * 対象メンバーだけがCarpool.membersから自動的に取り除かれ、
 * 他の車・他のメンバーの配置には影響しないことを確認する。
 */
test('回答が不参加に変更された人だけが車カードとCarpoolデータから自動的に除去される', async ({ page }) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const locA = await db.collection('pickupLocations').add({ name: '西公園', latitude: 35.0, longitude: 139.0 });
  const destinationRef = await db.collection('destinations').add({ name: '目的地A', latitude: 35.1, longitude: 139.1 });

  // 運転者家庭（定員4）
  const familyDriver = await db.collection('families').add({
    familyName: '鈴木家', vehicleCapacity: 4, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });

  // 不参加に変更される選手
  const familyLeaving = await db.collection('families').add({
    familyName: '山田家', vehicleCapacity: 0, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const playerLeaving = await db.collection('players').add({
    familyId: familyLeaving.id, name: '山田太郎', schoolEntryYear: 2019, isActive: true, createdAt: now, updatedAt: now,
  });

  // 引き続き参加する選手（除去の影響を受けないことを確認する対象）
  const familyStaying = await db.collection('families').add({
    familyName: '田中家', vehicleCapacity: 0, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const playerStaying = await db.collection('players').add({
    familyId: familyStaying.id, name: '田中次郎', schoolEntryYear: 2019, isActive: true, createdAt: now, updatedAt: now,
  });

  // 別の車に乗っている、無関係な選手（他の車の配置が変更されないことを確認する対象）
  const familyOtherCar = await db.collection('families').add({
    familyName: '佐藤家', vehicleCapacity: 4, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const familyOtherRider = await db.collection('families').add({
    familyName: '高橋家', vehicleCapacity: 0, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const playerOtherCar = await db.collection('players').add({
    familyId: familyOtherRider.id, name: '高橋花子', schoolEntryYear: 2019, isActive: true, createdAt: now, updatedAt: now,
  });

  const eventRef = await db.collection('events').add({
    name: '練習試合', date: '2026-08-01', destinationId: destinationRef.id, createdAt: now, updatedAt: now,
  });

  await eventRef.collection('responses').doc(familyDriver.id).set({
    driverOutward: true, driverReturn: true, capacityToday: null, remarks: '',
    players: [],
  });
  // 不参加に変更済み（isParticipating: false）。配車作成時点では参加だったが、その後不参加に変更された状態を表す
  await eventRef.collection('responses').doc(familyLeaving.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, remarks: '',
    players: [{ playerId: playerLeaving.id, isParticipating: false, noOutwardRide: false, noReturnRide: false }],
  });
  await eventRef.collection('responses').doc(familyStaying.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, remarks: '',
    players: [{ playerId: playerStaying.id, isParticipating: true, noOutwardRide: false, noReturnRide: false }],
  });
  await eventRef.collection('responses').doc(familyOtherCar.id).set({
    driverOutward: true, driverReturn: true, capacityToday: null, remarks: '',
    players: [],
  });
  await eventRef.collection('responses').doc(familyOtherRider.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, remarks: '',
    players: [{ playerId: playerOtherCar.id, isParticipating: true, noOutwardRide: false, noReturnRide: false }],
  });

  const carpoolWithLeavingRef = await eventRef.collection('carpools').add({
    direction: 'OUTWARD',
    driverFamilyId: familyDriver.id,
    capacity: 4,
    members: [
      { type: 'player', playerId: playerLeaving.id },
      { type: 'player', playerId: playerStaying.id },
    ],
  });
  const otherCarRef = await eventRef.collection('carpools').add({
    direction: 'OUTWARD',
    driverFamilyId: familyOtherCar.id,
    capacity: 4,
    members: [{ type: 'player', playerId: playerOtherCar.id }],
  });

  await page.goto(`/events/${eventRef.id}/carpool`);
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
  await expect(page.getByText('読み込み中...')).toHaveCount(0);

  // 不参加に変更された山田太郎は、未配車エリアにも車カードにも表示されない
  await expect(page.getByText('山田太郎')).toHaveCount(0);
  await expect(page.getByText('未配車')).toHaveCount(0);

  // 引き続き参加する田中次郎・無関係な高橋花子は表示されたまま
  await expect(page.getByText('田中次郎')).toBeVisible();
  await expect(page.getByText('高橋花子')).toBeVisible();

  // Firestore側でも山田太郎だけが取り除かれ、他のメンバー・他の車の配置は変更されていないことを確認する
  await expect.poll(async () => {
    const snapshot = await carpoolWithLeavingRef.get();
    return (snapshot.data()?.members ?? []).map((m: { playerId: string }) => m.playerId);
  }).toEqual([playerStaying.id]);

  const otherCarSnapshot = await otherCarRef.get();
  expect((otherCarSnapshot.data()?.members ?? []).map((m: { playerId: string }) => m.playerId)).toEqual([playerOtherCar.id]);
});
