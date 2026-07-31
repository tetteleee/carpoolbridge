import { test, expect } from '@playwright/test';
import { Timestamp } from 'firebase-admin/firestore';
import { getEmulatorFirestore } from './utils/firebaseAdmin';

/**
 * 家族（選手・コーチ以外で配車の対象になり得る人）を含む自動配車を検証するE2Eテスト。
 * 家族は選手と全く同じ判定ロジックで配車対象となり、家庭の車出し可否に紐づく
 * コーチのような特別な分岐（type: "coach"）を持たない。
 * ref: docs/05_データ設計.md#10 Carpool（配車結果） type: "family" について
 */
test('参加する家族は、選手と同じ乗車メンバーとして自動配車に含まれる（family号に選手・家族が同乗する）', async ({
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

  // 選手1人＋家族1人＋運転者本人で定員3ちょうど
  const familyRef = await db.collection('families').add({
    familyName: '佐藤家', coachName: null, vehicleCapacity: 3, pickupLocationId: pickupLocationRef.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const playerRef = await db.collection('players').add({
    familyId: familyRef.id, name: '佐藤太郎', schoolEntryYear: 2020, isActive: true, createdAt: now, updatedAt: now,
  });
  const familyMemberRef = await db.collection('familyMembers').add({
    familyId: familyRef.id, name: '佐藤祖母', isActive: true, createdAt: now, updatedAt: now,
  });
  const eventRef = await db.collection('events').add({
    name: '練習試合', date: '2026-08-01', destinationId: destinationRef.id, createdAt: now, updatedAt: now,
  });
  await eventRef.collection('responses').doc(familyRef.id).set({
    driverOutward: true, driverReturn: true, capacityToday: null, coachParticipating: null,
    coachNoOutwardRide: false, coachNoReturnRide: false, remarks: '',
    players: [{ playerId: playerRef.id, isParticipating: true, noOutwardRide: false, noReturnRide: false }],
    familyMembers: [
      { familyMemberId: familyMemberRef.id, isParticipating: true, noOutwardRide: false, noReturnRide: false },
    ],
  });

  await page.goto(`/events/${eventRef.id}/edit`);
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
  await expect(page.locator(`#family-response-card-${familyRef.id}`)).toBeVisible();

  await page.getByRole('button', { name: '自動配車', exact: true }).click();
  await page.waitForURL(`**/events/${eventRef.id}/carpool`);
  await expect(page.getByText('読み込み中...')).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);

  // 家族が type: "family" の通常の乗車メンバーとしてCarpool.membersに含まれることをFirestoreで確認
  const outwardSnapshot = await eventRef
    .collection('carpools')
    .where('direction', '==', 'OUTWARD')
    .get();
  expect(outwardSnapshot.docs).toHaveLength(1);
  const outwardData = outwardSnapshot.docs[0].data();
  expect(outwardData.members).toContainEqual({ type: 'family', familyMemberId: familyMemberRef.id });
  expect(outwardData.members).toContainEqual({ type: 'player', playerId: playerRef.id });

  // 画面上でも佐藤祖母が通常の人カードとして佐藤号の中に表示される。
  // 乗車率の分子は乗車メンバー数そのもの（運転者本人は加算しない）のため、
  // 選手1名＋家族1名の2/3になる（04_画面設計.md#8 乗車率の算出について）
  const carCard = page.locator('[data-drop-zone-id]').filter({ hasText: '佐藤号' });
  await expect(carCard.getByText('佐藤祖母')).toBeVisible();
  await expect(carCard.getByText('佐藤太郎')).toBeVisible();
  await expect(carCard.getByText('2/3')).toBeVisible();
});

test('家族のみで満席の場合、選手が乗れずHard Failし、対象家庭名を含むエラーが表示される', async ({ page }) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const pickupLocationRef = await db.collection('pickupLocations').add({
    name: '集合場所A', latitude: 35.0, longitude: 139.0,
  });
  const destinationRef = await db.collection('destinations').add({
    name: '目的地A', latitude: 35.1, longitude: 139.1,
  });

  // 定員1（家族のみでぴったり）なのに選手が1人いるため、優先割り当てグループが定員超過する
  const familyRef = await db.collection('families').add({
    familyName: '佐藤家', coachName: null, vehicleCapacity: 1, pickupLocationId: pickupLocationRef.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const playerRef = await db.collection('players').add({
    familyId: familyRef.id, name: '佐藤太郎', schoolEntryYear: 2020, isActive: true, createdAt: now, updatedAt: now,
  });
  const familyMemberRef = await db.collection('familyMembers').add({
    familyId: familyRef.id, name: '佐藤祖母', isActive: true, createdAt: now, updatedAt: now,
  });
  const eventRef = await db.collection('events').add({
    name: '練習試合', date: '2026-08-01', destinationId: destinationRef.id, createdAt: now, updatedAt: now,
  });
  await eventRef.collection('responses').doc(familyRef.id).set({
    driverOutward: true, driverReturn: true, capacityToday: null, coachParticipating: null,
    coachNoOutwardRide: false, coachNoReturnRide: false, remarks: '',
    players: [{ playerId: playerRef.id, isParticipating: true, noOutwardRide: false, noReturnRide: false }],
    familyMembers: [
      { familyMemberId: familyMemberRef.id, isParticipating: true, noOutwardRide: false, noReturnRide: false },
    ],
  });

  await page.goto(`/events/${eventRef.id}/edit`);
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
  await expect(page.locator(`#family-response-card-${familyRef.id}`)).toBeVisible();

  await page.getByRole('button', { name: '自動配車', exact: true }).click();

  const errorMessage = page.getByText('様の優先割り当て人数（同乗必須メンバー数）が、車両の有効定員を超過しています');
  await expect(errorMessage).toBeVisible();
  expect(page.url()).toContain(`/events/${eventRef.id}/edit`);
});

test('家族が行きの送迎不要（現地集合等）の場合、行きタブでは配車不要エリアに表示され、車には含まれない', async ({
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

  const familyDriver = await db.collection('families').add({
    familyName: '鈴木家', coachName: null, vehicleCapacity: 4, pickupLocationId: pickupLocationRef.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const familyRef = await db.collection('families').add({
    familyName: '木村家', coachName: null, vehicleCapacity: 0, pickupLocationId: pickupLocationRef.id,
    isActive: true, createdAt: now, updatedAt: now,
  });
  const familyMemberRef = await db.collection('familyMembers').add({
    familyId: familyRef.id, name: '木村祖父', isActive: true, createdAt: now, updatedAt: now,
  });
  const eventRef = await db.collection('events').add({
    name: '練習試合', date: '2026-08-01', destinationId: destinationRef.id, createdAt: now, updatedAt: now,
  });
  await eventRef.collection('responses').doc(familyDriver.id).set({
    driverOutward: true, driverReturn: true, capacityToday: null, coachParticipating: null,
    coachNoOutwardRide: false, coachNoReturnRide: false, remarks: '', players: [], familyMembers: [],
  });
  await eventRef.collection('responses').doc(familyRef.id).set({
    driverOutward: false, driverReturn: false, capacityToday: null, coachParticipating: null,
    coachNoOutwardRide: false, coachNoReturnRide: false, remarks: '', players: [],
    familyMembers: [
      { familyMemberId: familyMemberRef.id, isParticipating: true, noOutwardRide: true, noReturnRide: false },
    ],
  });

  await page.goto(`/events/${eventRef.id}/carpool`);
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
  await expect(page.getByText('読み込み中...')).toHaveCount(0);

  // 行きタブ（初期表示）：家族の行き送迎スイッチがOFFのため配車不要エリアに表示される
  await expect(page.getByRole('heading', { name: '配車不要　1名' })).toBeVisible();
  await expect(page.getByText('木村祖父')).toBeVisible();
  await expect(page.getByRole('heading', { name: /未配車/ })).toHaveCount(0);

  // 帰りタブ：家族の帰り送迎スイッチはONのため未配車エリアに表示される
  await page.getByRole('tab', { name: '帰り' }).click();
  await expect(page.getByRole('heading', { name: /配車不要/ })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '未配車　1名' })).toBeVisible();
  await expect(page.getByText('木村祖父')).toBeVisible();
});
