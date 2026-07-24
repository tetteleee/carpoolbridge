import { test, expect } from '@playwright/test';
import { Timestamp } from 'firebase-admin/firestore';
import { getEmulatorFirestore } from './utils/firebaseAdmin';

/**
 * 配車画面（メイン）のリアルタイム警告（定員超過・未配車チェック）（T44）を検証するE2Eテスト。
 */
test('人カードの移動により未配車→定員超過へ警告内容がリアルタイムに切り替わる', async ({ page }) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const locA = await db.collection('pickupLocations').add({ name: '西公園', latitude: 35.0, longitude: 139.0 });
  const destinationRef = await db.collection('destinations').add({ name: '目的地A', latitude: 35.1, longitude: 139.1 });

  const familyDriver = await db.collection('families').add({
    familyName: '鈴木家', coachName: null, vehicleCapacity: 2, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });

  const familyRiderA = await db.collection('families').add({
    familyName: '山田家', coachName: null, vehicleCapacity: 0, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const childRiderA = await db.collection('children').add({
    familyId: familyRiderA.id, name: '山田太郎', schoolEntryYear: 2019, isActive: true, createdAt: now, updatedAt: now,
  });

  const familyRiderB = await db.collection('families').add({
    familyName: '田中家', coachName: null, vehicleCapacity: 0, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const childRiderB = await db.collection('children').add({
    familyId: familyRiderB.id, name: '田中次郎', schoolEntryYear: 2019, isActive: true, createdAt: now, updatedAt: now,
  });

  const eventRef = await db.collection('events').add({
    name: '練習試合', date: '2026-08-01', destinationId: destinationRef.id, createdAt: now, updatedAt: now,
  });

  await eventRef.collection('responses').doc(familyDriver.id).set({
    driverOutward: true, driverReturn: true, capacityToday: null, coachParticipating: null, remarks: '',
    children: [],
  });
  await eventRef.collection('responses').doc(familyRiderA.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, coachParticipating: null, remarks: '',
    children: [{ childId: childRiderA.id, isParticipating: true, noOutwardRide: false, noReturnRide: false }],
  });
  await eventRef.collection('responses').doc(familyRiderB.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, coachParticipating: null, remarks: '',
    children: [{ childId: childRiderB.id, isParticipating: true, noOutwardRide: false, noReturnRide: false }],
  });

  // 定員2（運転者含む）の車に山田太郎のみ乗車済み（定員内）、田中次郎は未配車の状態を直接作成する
  await eventRef.collection('carpools').add({
    direction: 'OUTWARD',
    driverFamilyId: familyDriver.id,
    capacity: 2,
    members: [{ type: 'child', childId: childRiderA.id }],
  });

  await page.goto(`/events/${eventRef.id}/carpool`);
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
  await expect(page.getByText('読み込み中...')).toHaveCount(0);

  // 初期状態：田中次郎が未配車のため「未配車の子供がいます」が表示される
  await expect(page.getByText('未配車　1名')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveText('⚠ 未配車の子供がいます');

  // 田中次郎を鈴木号（定員2・既に山田太郎が乗車済み）へドラッグ＆ドロップする
  const personCard = page.getByText('田中次郎').locator('..');
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

  // 移動後：未配車は0名になり、鈴木号が定員超過（3/2）となるため
  // 画面を再読み込みすることなく警告内容が「定員超過の車があります」に切り替わる
  await expect(page.getByText('未配車')).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveText('⚠ 定員超過の車があります');
});

test('参加コーチが自分の家庭の車にいない場合「運転者不在」警告が表示され、車に戻すと解消される', async ({ page }) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const locA = await db.collection('pickupLocations').add({ name: '西公園', latitude: 35.0, longitude: 139.0 });
  const destinationRef = await db.collection('destinations').add({ name: '目的地A', latitude: 35.1, longitude: 139.1 });

  // コーチが紐づき運転する家庭。定員2（コーチ+子供でぴったり）
  const familyCoach = await db.collection('families').add({
    familyName: '佐藤家', coachName: '佐藤父', vehicleCapacity: 2, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const childCoachFamily = await db.collection('children').add({
    familyId: familyCoach.id, name: '佐藤太郎', schoolEntryYear: 2019, isActive: true, createdAt: now, updatedAt: now,
  });

  // 車出しをしない、未配車のまま残る家庭
  const familyUnassigned = await db.collection('families').add({
    familyName: '高橋家', coachName: null, vehicleCapacity: 0, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const childUnassigned = await db.collection('children').add({
    familyId: familyUnassigned.id, name: '高橋花子', schoolEntryYear: 2019, isActive: true, createdAt: now, updatedAt: now,
  });

  const eventRef = await db.collection('events').add({
    name: '練習試合', date: '2026-08-01', destinationId: destinationRef.id, createdAt: now, updatedAt: now,
  });

  await eventRef.collection('responses').doc(familyCoach.id).set({
    driverOutward: true, driverReturn: true, capacityToday: null, coachParticipating: true, remarks: '',
    children: [{ childId: childCoachFamily.id, isParticipating: true, noOutwardRide: false, noReturnRide: false }],
  });
  await eventRef.collection('responses').doc(familyUnassigned.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, coachParticipating: null, remarks: '',
    children: [{ childId: childUnassigned.id, isParticipating: true, noOutwardRide: false, noReturnRide: false }],
  });

  // 佐藤父（コーチ）を含めずに佐藤号を直接作成する（＝ドラッグで運転者不在になった状態を再現）
  await eventRef.collection('carpools').add({
    direction: 'OUTWARD',
    driverFamilyId: familyCoach.id,
    capacity: 2,
    members: [{ type: 'child', childId: childCoachFamily.id }],
  });

  await page.goto(`/events/${eventRef.id}/carpool`);
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
  await expect(page.getByText('読み込み中...')).toHaveCount(0);

  // 佐藤父（コーチ）が車にいないため「運転者不在」、高橋花子が未配車のため両方の警告が出る
  await expect(page.getByRole('alert')).toHaveText('⚠ 運転者不在の車と未配車の子供があります');

  // 佐藤父を佐藤号へドラッグ＆ドロップする
  const coachCard = page.getByText('佐藤父').locator('..');
  const carCard = page.locator('[data-drop-zone-id]').filter({ hasText: '佐藤号' });

  const coachBox = await coachCard.boundingBox();
  const carBox = await carCard.boundingBox();
  if (!coachBox || !carBox) {
    throw new Error('bounding box not found');
  }

  const startX = coachBox.x + coachBox.width / 2;
  const startY = coachBox.y + coachBox.height / 2;
  const endX = carBox.x + carBox.width / 2;
  const endY = carBox.y + carBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.waitForTimeout(300);
  await page.mouse.move((startX + endX) / 2, (startY + endY) / 2, { steps: 5 });
  await page.mouse.move(endX, endY, { steps: 5 });
  await page.mouse.up();

  // 佐藤父が車に戻ったため「運転者不在」は解消され、高橋花子の未配車のみ警告に残る
  await expect(page.getByRole('alert')).toHaveText('⚠ 未配車の子供がいます');
});
