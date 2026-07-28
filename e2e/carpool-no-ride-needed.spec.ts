import { test, expect } from '@playwright/test';
import { Timestamp } from 'firebase-admin/firestore';
import { getEmulatorFirestore } from './utils/firebaseAdmin';

/**
 * 配車画面（メイン）の配車不要エリア・サマリー帯チップ（T61〜T63）を検証するE2Eテスト。
 */

/** FlagIcon（配車不要の表示に使用）のSVGパス。テキストが数字のみのチップを識別するために使用する */
const FLAG_ICON_PATH = 'svg path[d="M5 4h13l-3 4 3 4H5"]';

/** 匿名認証・staffUsers登録を済ませ、配車画面が表示されるまで待つ共通処理 */
async function signInAndOpenCarpoolPage(
  page: import('@playwright/test').Page,
  db: ReturnType<typeof getEmulatorFirestore>,
  eventId: string
) {
  await page.goto(`/events/${eventId}/carpool`);
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
  await expect(page.getByText('読み込み中...')).toHaveCount(0);
}

test('参加かつ送迎不要の子供が配車不要エリアに表示され、未配車エリア・車カードには表示されない。未回答・不参加・コーチは含まれない', async ({ page }) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const locA = await db.collection('pickupLocations').add({ name: '西公園', latitude: 35.0, longitude: 139.0 });
  const destinationRef = await db.collection('destinations').add({ name: '目的地A', latitude: 35.1, longitude: 139.1 });

  const familyDriver = await db.collection('families').add({
    familyName: '鈴木家', coachName: null, vehicleCapacity: 4, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });

  const familyUnassigned = await db.collection('families').add({
    familyName: '山田家', coachName: null, vehicleCapacity: 0, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const childUnassigned = await db.collection('children').add({
    familyId: familyUnassigned.id, name: '山田太郎', schoolEntryYear: 2019, isActive: true, createdAt: now, updatedAt: now,
  });

  const familyNoRide = await db.collection('families').add({
    familyName: '木村家', coachName: null, vehicleCapacity: 0, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const childNoRide = await db.collection('children').add({
    familyId: familyNoRide.id, name: '木村美咲', schoolEntryYear: 2019, isActive: true, createdAt: now, updatedAt: now,
  });

  // 未回答（Responseドキュメント自体を作成しない）
  const familyUnanswered = await db.collection('families').add({
    familyName: '未回答家', coachName: null, vehicleCapacity: 0, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  await db.collection('children').add({
    familyId: familyUnanswered.id, name: '未回答太郎', schoolEntryYear: 2019, isActive: true, createdAt: now, updatedAt: now,
  });

  // 不参加（isParticipating: false）
  const familyDeclined = await db.collection('families').add({
    familyName: '不参加家', coachName: null, vehicleCapacity: 0, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const childDeclined = await db.collection('children').add({
    familyId: familyDeclined.id, name: '不参加花子', schoolEntryYear: 2019, isActive: true, createdAt: now, updatedAt: now,
  });

  // 参加コーチ（送迎要否の概念を持たないため配車不要エリアには含まれない）
  const familyCoach = await db.collection('families').add({
    familyName: '佐藤家', coachName: '佐藤父', vehicleCapacity: 0, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });

  const eventRef = await db.collection('events').add({
    name: '練習試合', date: '2026-08-01', destinationId: destinationRef.id, createdAt: now, updatedAt: now,
  });

  await eventRef.collection('responses').doc(familyDriver.id).set({
    driverOutward: true, driverReturn: true, capacityToday: null, coachParticipating: null, remarks: '',
    children: [],
  });
  await eventRef.collection('responses').doc(familyUnassigned.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, coachParticipating: null, remarks: '',
    children: [{ childId: childUnassigned.id, isParticipating: true, noOutwardRide: false, noReturnRide: false }],
  });
  await eventRef.collection('responses').doc(familyNoRide.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, coachParticipating: null, remarks: '',
    children: [{ childId: childNoRide.id, isParticipating: true, noOutwardRide: true, noReturnRide: false }],
  });
  await eventRef.collection('responses').doc(familyDeclined.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, coachParticipating: null, remarks: '',
    children: [{ childId: childDeclined.id, isParticipating: false, noOutwardRide: false, noReturnRide: false }],
  });
  await eventRef.collection('responses').doc(familyCoach.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, coachParticipating: true, remarks: '',
    children: [],
  });

  // 鈴木号（定員4・乗車メンバーなし）を作成し、配車不要の子供が車カードに含まれないことも確認できるようにする
  await eventRef.collection('carpools').add({
    direction: 'OUTWARD',
    driverFamilyId: familyDriver.id,
    capacity: 4,
    members: [],
  });

  await signInAndOpenCarpoolPage(page, db, eventRef.id);

  // 配車不要エリア：木村美咲のみが対象（山田太郎・佐藤父は含まれない）
  await expect(page.getByRole('heading', { name: '配車不要　1名' })).toBeVisible();
  const noRideSection = page.locator('section').filter({ has: page.getByRole('heading', { name: '配車不要　1名' }) });
  await expect(noRideSection.getByText('木村美咲')).toBeVisible();
  await expect(noRideSection.getByText('山田太郎')).toHaveCount(0);
  await expect(noRideSection.getByText('佐藤父')).toHaveCount(0);

  // 未配車エリア：山田太郎・佐藤父（コーチ）が対象。木村美咲は含まれない
  await expect(page.getByRole('heading', { name: '未配車　2名' })).toBeVisible();
  const unassignedSection = page.locator('section').filter({ has: page.getByRole('heading', { name: '未配車　2名' }) });
  await expect(unassignedSection.getByText('山田太郎')).toBeVisible();
  await expect(unassignedSection.getByText('佐藤父')).toBeVisible();
  await expect(unassignedSection.getByText('木村美咲')).toHaveCount(0);

  // 車カード：木村美咲は含まれない
  const carCard = page.locator('[data-drop-zone-id]').filter({ hasText: '鈴木号' });
  await expect(carCard.getByText('木村美咲')).toHaveCount(0);

  // 未回答・不参加の子供は画面上どこにも表示されない
  await expect(page.getByText('未回答太郎')).toHaveCount(0);
  await expect(page.getByText('不参加花子')).toHaveCount(0);
});

test('配車不要が0人の場合、配車不要エリア・サマリー帯のチップがいずれも表示されない', async ({ page }) => {
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

  await signInAndOpenCarpoolPage(page, db, eventRef.id);

  await expect(page.getByText('未配車　1名')).toBeVisible();
  await expect(page.getByRole('heading', { name: /配車不要/ })).toHaveCount(0);
  // 配車不要エリアの見出し・サマリー帯チップのいずれも旗アイコンを使うため、
  // 画面上に旗アイコンが1つも存在しないことで両方が非表示であることを確認する
  await expect(page.locator(FLAG_ICON_PATH)).toHaveCount(0);
});

test('サマリー帯の配車不要人数チップが、各車チップの後ろに表示される', async ({ page }) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const locA = await db.collection('pickupLocations').add({ name: '西公園', latitude: 35.0, longitude: 139.0 });
  const destinationRef = await db.collection('destinations').add({ name: '目的地A', latitude: 35.1, longitude: 139.1 });

  const familyDriver = await db.collection('families').add({
    familyName: '鈴木家', coachName: null, vehicleCapacity: 4, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const familyNoRide = await db.collection('families').add({
    familyName: '木村家', coachName: null, vehicleCapacity: 0, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const childNoRide = await db.collection('children').add({
    familyId: familyNoRide.id, name: '木村美咲', schoolEntryYear: 2019, isActive: true, createdAt: now, updatedAt: now,
  });

  const eventRef = await db.collection('events').add({
    name: '練習試合', date: '2026-08-01', destinationId: destinationRef.id, createdAt: now, updatedAt: now,
  });
  await eventRef.collection('responses').doc(familyDriver.id).set({
    driverOutward: true, driverReturn: true, capacityToday: null, coachParticipating: null, remarks: '',
    children: [],
  });
  await eventRef.collection('responses').doc(familyNoRide.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, coachParticipating: null, remarks: '',
    children: [{ childId: childNoRide.id, isParticipating: true, noOutwardRide: true, noReturnRide: false }],
  });

  await eventRef.collection('carpools').add({
    direction: 'OUTWARD',
    driverFamilyId: familyDriver.id,
    capacity: 4,
    members: [],
  });

  await signInAndOpenCarpoolPage(page, db, eventRef.id);
  await expect(page.getByRole('heading', { name: '配車不要　1名' })).toBeVisible();

  // サマリー帯（画面上部・sticky領域）は本文（車カード・配車不要エリア）より先にDOMへ描画されるため、
  // 「鈴木号」「旗アイコン」それぞれの最初の出現がサマリー帯側のチップになる
  const carChipNameBox = await page.getByText('鈴木号').first().boundingBox();
  const noRideChipIconBox = await page.locator(FLAG_ICON_PATH).first().boundingBox();
  if (!carChipNameBox || !noRideChipIconBox) {
    throw new Error('bounding box not found');
  }

  // 同じ行に折り返されていれば配車不要チップが右側、別の行に折り返されていれば下側に来る
  const isAfter =
    noRideChipIconBox.y > carChipNameBox.y + 5 ||
    (Math.abs(noRideChipIconBox.y - carChipNameBox.y) <= 5 && noRideChipIconBox.x > carChipNameBox.x);
  expect(isAfter).toBe(true);
});

test('行き／帰りタブを切り替えると、配車不要エリア・チップの内容が連動して切り替わる', async ({ page }) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const locA = await db.collection('pickupLocations').add({ name: '西公園', latitude: 35.0, longitude: 139.0 });
  const destinationRef = await db.collection('destinations').add({ name: '目的地A', latitude: 35.1, longitude: 139.1 });

  const familyNoRideOutward = await db.collection('families').add({
    familyName: '木村家', coachName: null, vehicleCapacity: 0, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const childNoRideOutward = await db.collection('children').add({
    familyId: familyNoRideOutward.id, name: '木村美咲', schoolEntryYear: 2019, isActive: true, createdAt: now, updatedAt: now,
  });

  const eventRef = await db.collection('events').add({
    name: '練習試合', date: '2026-08-01', destinationId: destinationRef.id, createdAt: now, updatedAt: now,
  });
  // 行きは送迎不要・帰りは送迎必要
  await eventRef.collection('responses').doc(familyNoRideOutward.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, coachParticipating: null, remarks: '',
    children: [{ childId: childNoRideOutward.id, isParticipating: true, noOutwardRide: true, noReturnRide: false }],
  });

  await signInAndOpenCarpoolPage(page, db, eventRef.id);

  // 行きタブ（初期表示）：配車不要エリアに表示される
  await expect(page.getByRole('heading', { name: '配車不要　1名' })).toBeVisible();
  await expect(page.getByText('木村美咲')).toBeVisible();

  // 帰りタブへ切り替え：送迎必要になるため配車不要エリアは消え、未配車エリアに表示される
  await page.getByRole('tab', { name: '帰り' }).click();
  await expect(page.getByRole('heading', { name: /配車不要/ })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '未配車　1名' })).toBeVisible();
  await expect(page.getByText('木村美咲')).toBeVisible();
});

test('配車不要エリア内の人カードにドラッグハンドルが表示されず、ドラッグ操作の起点にならない', async ({ page }) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const locA = await db.collection('pickupLocations').add({ name: '西公園', latitude: 35.0, longitude: 139.0 });
  const destinationRef = await db.collection('destinations').add({ name: '目的地A', latitude: 35.1, longitude: 139.1 });

  const familyDriver = await db.collection('families').add({
    familyName: '鈴木家', coachName: null, vehicleCapacity: 4, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const familyNoRide = await db.collection('families').add({
    familyName: '木村家', coachName: null, vehicleCapacity: 0, pickupLocationId: locA.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const childNoRide = await db.collection('children').add({
    familyId: familyNoRide.id, name: '木村美咲', schoolEntryYear: 2019, isActive: true, createdAt: now, updatedAt: now,
  });

  const eventRef = await db.collection('events').add({
    name: '練習試合', date: '2026-08-01', destinationId: destinationRef.id, createdAt: now, updatedAt: now,
  });
  await eventRef.collection('responses').doc(familyDriver.id).set({
    driverOutward: true, driverReturn: true, capacityToday: null, coachParticipating: null, remarks: '',
    children: [],
  });
  await eventRef.collection('responses').doc(familyNoRide.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, coachParticipating: null, remarks: '',
    children: [{ childId: childNoRide.id, isParticipating: true, noOutwardRide: true, noReturnRide: false }],
  });

  const carpoolRef = await eventRef.collection('carpools').add({
    direction: 'OUTWARD',
    driverFamilyId: familyDriver.id,
    capacity: 4,
    members: [],
  });

  await signInAndOpenCarpoolPage(page, db, eventRef.id);
  await expect(page.getByRole('heading', { name: '配車不要　1名' })).toBeVisible();

  const noRideSection = page.locator('section').filter({ has: page.getByRole('heading', { name: '配車不要　1名' }) });

  // ドラッグハンドル（≡）ではなく、配車不要を示す旗アイコンが表示されている
  await expect(noRideSection.locator('[aria-label="ドラッグハンドル"]')).toHaveCount(0);
  await expect(noRideSection.locator('[aria-label="配車不要"]')).toBeVisible();

  // 車カードへドラッグを試みても移動しないことを確認する
  const personCard = noRideSection.getByText('木村美咲').locator('..');
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
  await page.waitForTimeout(600);
  await page.mouse.move((startX + endX) / 2, (startY + endY) / 2, { steps: 5 });
  await page.mouse.move(endX, endY, { steps: 5 });
  await page.mouse.up();

  // 配車不要エリアに留まったままであることを確認する
  await expect(page.getByRole('heading', { name: '配車不要　1名' })).toBeVisible();
  await expect(noRideSection.getByText('木村美咲')).toBeVisible();

  const carpoolSnapshot = await carpoolRef.get();
  expect(carpoolSnapshot.data()?.members).toEqual([]);
});
