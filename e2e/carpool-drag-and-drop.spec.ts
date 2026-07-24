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

test('画面外（下方）の車カードへは、画面端までドラッグするとオートスクロールして移動できる', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 700 });

  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const locA = await db.collection('pickupLocations').add({ name: '西公園', latitude: 35.0, longitude: 139.0 });
  const destinationRef = await db.collection('destinations').add({ name: '目的地A', latitude: 35.1, longitude: 139.1 });

  // 車カードを画面に収まらない台数分作成し、一覧の末尾の車が画面外（要スクロール）になるようにする
  const driverNames = ['鈴木', '佐藤', '田中', '高橋', '渡辺', '伊藤', '山本', '中村', '小林', '加藤'];
  const driverFamilies = [];
  for (const name of driverNames) {
    const familyRef = await db.collection('families').add({
      familyName: `${name}家`, coachName: null, vehicleCapacity: 1, pickupLocationId: locA.id,
      isActive: true, createdAt: now, updatedAt: now,
    });
    driverFamilies.push(familyRef);
  }
  const firstDriverFamily = driverFamilies[0];

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

  for (const familyRef of driverFamilies) {
    await eventRef.collection('responses').doc(familyRef.id).set({
      driverOutward: true, driverReturn: true, capacityToday: null, coachParticipating: null, remarks: '',
      children: [],
    });
  }
  await eventRef.collection('responses').doc(familyRider.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, coachParticipating: null, remarks: '',
    children: [{ childId: childRider.id, isParticipating: true, noOutwardRide: false, noReturnRide: false }],
  });

  await page.goto(`/events/${eventRef.id}/edit`);
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
  await expect(page.locator(`#family-response-card-${firstDriverFamily.id}`)).toBeVisible();
  await page.getByRole('button', { name: '配車作成' }).click();
  await page.waitForURL(`**/events/${eventRef.id}/carpool`);
  await expect(page.getByText('読み込み中...')).toHaveCount(0);
  // 各車は定員1（運転者のみ）のため、山田太郎は自動配車されず未配車のまま残る
  await expect(page.getByText('未配車　1名')).toBeVisible();

  // 一覧の並び順（家庭ID順とは限らない）に依存しないよう、DOM上で最後に描画された車カードを対象にする
  const lastCarCard = page.locator('[data-drop-zone-id]').last();
  const lastCarpoolId = await lastCarCard.getAttribute('data-drop-zone-id');
  if (!lastCarpoolId) throw new Error('data-drop-zone-id not found');

  // 前提確認：最後の車カードはビューポート外（スクロールしないと見えない位置）にある
  const initialCarBox = await lastCarCard.boundingBox();
  if (!initialCarBox) throw new Error('bounding box not found');
  expect(initialCarBox.y).toBeGreaterThan(700);

  const personCard = page.getByText('山田太郎').locator('..');
  const personBox = await personCard.boundingBox();
  if (!personBox) throw new Error('bounding box not found');

  await page.mouse.move(personBox.x + personBox.width / 2, personBox.y + personBox.height / 2);
  await page.mouse.down();
  // 長押し判定を超えて待機してからドラッグを開始する
  await page.waitForTimeout(600);

  // 画面下端付近までドラッグし、オートスクロールを発生させる
  await page.mouse.move(personBox.x + personBox.width / 2, 690, { steps: 5 });
  await page.waitForTimeout(1500);

  // 画面中央へ戻し、オートスクロールを停止する
  await page.mouse.move(200, 350, { steps: 5 });

  // オートスクロールにより最後の車カードが画面内に入っていることを確認する
  const carBoxAfterScroll = await lastCarCard.boundingBox();
  if (!carBoxAfterScroll) throw new Error('bounding box not found after scroll');
  expect(carBoxAfterScroll.y).toBeLessThan(700);

  await page.mouse.move(
    carBoxAfterScroll.x + carBoxAfterScroll.width / 2,
    carBoxAfterScroll.y + carBoxAfterScroll.height / 2,
    { steps: 5 }
  );
  await page.mouse.up();

  await expect(page.getByText('未配車')).toHaveCount(0);

  const targetCarpool = await eventRef.collection('carpools').doc(lastCarpoolId).get();
  expect(targetCarpool.data()?.members).toEqual([{ type: 'child', childId: childRider.id }]);
});

test('同じ車の中で人カードをドラッグすると、ドロップした位置に並び替えられる', async ({ page }) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const locA = await db.collection('pickupLocations').add({ name: '西公園', latitude: 35.0, longitude: 139.0 });
  const destinationRef = await db.collection('destinations').add({ name: '目的地A', latitude: 35.1, longitude: 139.1 });

  const familyDriver = await db.collection('families').add({
    familyName: '鈴木家', coachName: null, vehicleCapacity: 4, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });

  const riderNames = ['山田太郎', '佐藤花子', '田中一郎'];
  const riderFamilyIds: string[] = [];
  const riderChildIds: string[] = [];
  for (const name of riderNames) {
    const familyRef = await db.collection('families').add({
      familyName: `${name}家`, coachName: null, vehicleCapacity: 0, pickupLocationId: locA.id,
      isActive: true, createdAt: now, updatedAt: now,
    });
    const childRef = await db.collection('children').add({
      familyId: familyRef.id, name, schoolEntryYear: 2019, isActive: true, createdAt: now, updatedAt: now,
    });
    riderFamilyIds.push(familyRef.id);
    riderChildIds.push(childRef.id);
  }
  const [yamadaId, satoId, tanakaId] = riderChildIds;

  const eventRef = await db.collection('events').add({
    name: '練習試合', date: '2026-08-01', destinationId: destinationRef.id, createdAt: now, updatedAt: now,
  });

  await eventRef.collection('responses').doc(familyDriver.id).set({
    driverOutward: true, driverReturn: true, capacityToday: null, coachParticipating: null, remarks: '',
    children: [],
  });
  for (let i = 0; i < riderChildIds.length; i += 1) {
    await eventRef.collection('responses').doc(riderFamilyIds[i]).set({
      driverOutward: false, driverReturn: false, capacityToday: null, coachParticipating: null, remarks: '',
      children: [{ childId: riderChildIds[i], isParticipating: true, noOutwardRide: false, noReturnRide: false }],
    });
  }

  // 鈴木号に山田太郎・佐藤花子・田中一郎の順で乗車済みの状態を直接作成する
  const carpoolRef = await eventRef.collection('carpools').add({
    direction: 'OUTWARD',
    driverFamilyId: familyDriver.id,
    driverIsCoach: false,
    capacity: 4,
    members: [
      { type: 'child', childId: yamadaId },
      { type: 'child', childId: satoId },
      { type: 'child', childId: tanakaId },
    ],
  });

  await page.goto(`/events/${eventRef.id}/carpool`);
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
  await expect(page.getByText('読み込み中...')).toHaveCount(0);

  const satoCard = page.getByText('佐藤花子').locator('..');
  const yamadaCard = page.getByText('山田太郎').locator('..');
  const satoBox = await satoCard.boundingBox();
  const yamadaBox = await yamadaCard.boundingBox();
  if (!satoBox || !yamadaBox) {
    throw new Error('bounding box not found');
  }

  // 佐藤花子を、一覧先頭の山田太郎カードの上半分（挿入先の直前とみなされる領域）へドラッグする
  const startX = satoBox.x + satoBox.width / 2;
  const startY = satoBox.y + satoBox.height / 2;
  const endX = yamadaBox.x + yamadaBox.width / 2;
  const endY = yamadaBox.y + 4;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.waitForTimeout(600);
  await page.mouse.move((startX + endX) / 2, (startY + endY) / 2, { steps: 5 });
  await page.mouse.move(endX, endY, { steps: 5 });
  await page.mouse.up();

  await expect(async () => {
    const carpoolSnapshot = await carpoolRef.get();
    expect(carpoolSnapshot.data()?.members).toEqual([
      { type: 'child', childId: satoId },
      { type: 'child', childId: yamadaId },
      { type: 'child', childId: tanakaId },
    ]);
  }).toPass();
});

test('未配車から車カードへ、既存メンバーの位置を指定してドロップすると、その位置に挿入される', async ({ page }) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const locA = await db.collection('pickupLocations').add({ name: '西公園', latitude: 35.0, longitude: 139.0 });
  const destinationRef = await db.collection('destinations').add({ name: '目的地A', latitude: 35.1, longitude: 139.1 });

  const familyDriver = await db.collection('families').add({
    familyName: '鈴木家', coachName: null, vehicleCapacity: 4, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });

  const familySato = await db.collection('families').add({
    familyName: '佐藤家', coachName: null, vehicleCapacity: 0, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const childSato = await db.collection('children').add({
    familyId: familySato.id, name: '佐藤花子', schoolEntryYear: 2019, isActive: true, createdAt: now, updatedAt: now,
  });

  const familyTanaka = await db.collection('families').add({
    familyName: '田中家', coachName: null, vehicleCapacity: 0, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const childTanaka = await db.collection('children').add({
    familyId: familyTanaka.id, name: '田中一郎', schoolEntryYear: 2019, isActive: true, createdAt: now, updatedAt: now,
  });

  const familyYamada = await db.collection('families').add({
    familyName: '山田家', coachName: null, vehicleCapacity: 0, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const childYamada = await db.collection('children').add({
    familyId: familyYamada.id, name: '山田太郎', schoolEntryYear: 2019, isActive: true, createdAt: now, updatedAt: now,
  });

  const eventRef = await db.collection('events').add({
    name: '練習試合', date: '2026-08-01', destinationId: destinationRef.id, createdAt: now, updatedAt: now,
  });

  await eventRef.collection('responses').doc(familyDriver.id).set({
    driverOutward: true, driverReturn: true, capacityToday: null, coachParticipating: null, remarks: '',
    children: [],
  });
  await eventRef.collection('responses').doc(familySato.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, coachParticipating: null, remarks: '',
    children: [{ childId: childSato.id, isParticipating: true, noOutwardRide: false, noReturnRide: false }],
  });
  await eventRef.collection('responses').doc(familyTanaka.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, coachParticipating: null, remarks: '',
    children: [{ childId: childTanaka.id, isParticipating: true, noOutwardRide: false, noReturnRide: false }],
  });
  await eventRef.collection('responses').doc(familyYamada.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, coachParticipating: null, remarks: '',
    children: [{ childId: childYamada.id, isParticipating: true, noOutwardRide: false, noReturnRide: false }],
  });

  // 鈴木号に佐藤花子・田中一郎の順で乗車済み。山田太郎は未配車のまま
  const carpoolRef = await eventRef.collection('carpools').add({
    direction: 'OUTWARD',
    driverFamilyId: familyDriver.id,
    driverIsCoach: false,
    capacity: 4,
    members: [
      { type: 'child', childId: childSato.id },
      { type: 'child', childId: childTanaka.id },
    ],
  });

  await page.goto(`/events/${eventRef.id}/carpool`);
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
  await expect(page.getByText('読み込み中...')).toHaveCount(0);

  const yamadaCard = page.getByText('山田太郎').locator('..');
  const tanakaCard = page.getByText('田中一郎').locator('..');
  const yamadaBox = await yamadaCard.boundingBox();
  const tanakaBox = await tanakaCard.boundingBox();
  if (!yamadaBox || !tanakaBox) {
    throw new Error('bounding box not found');
  }

  // 山田太郎を、田中一郎カードの上半分（＝田中一郎の直前に挿入される領域）へドラッグする
  const startX = yamadaBox.x + yamadaBox.width / 2;
  const startY = yamadaBox.y + yamadaBox.height / 2;
  const endX = tanakaBox.x + tanakaBox.width / 2;
  const endY = tanakaBox.y + 4;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.waitForTimeout(600);
  await page.mouse.move((startX + endX) / 2, (startY + endY) / 2, { steps: 5 });
  await page.mouse.move(endX, endY, { steps: 5 });
  await page.mouse.up();

  await expect(async () => {
    const carpoolSnapshot = await carpoolRef.get();
    expect(carpoolSnapshot.data()?.members).toEqual([
      { type: 'child', childId: childSato.id },
      { type: 'child', childId: childYamada.id },
      { type: 'child', childId: childTanaka.id },
    ]);
  }).toPass();
});
