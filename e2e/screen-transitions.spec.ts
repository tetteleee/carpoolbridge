import { test, expect } from '@playwright/test';
import { Timestamp } from 'firebase-admin/firestore';
import { getEmulatorFirestore } from './utils/firebaseAdmin';

/**
 * T47: docs/04_画面設計.md#4 画面遷移（mermaid図）に定義された全ての遷移を
 * 一通りたどる通しE2Eテスト。各遷移は他のspecで個別に検証済みだが、本テストは
 * 遷移図全体が実際にひと続きの操作でたどれることを確認する。
 *
 * A[ホーム] -> C[配車画面メイン] -> D[イベント編集 回答入力] -> C（戻る／自動配車）
 * A -> B[イベント作成] -> A
 * A -> F[マスタ管理] -> A
 * A -> G[イベント情報編集] -> A
 */
test('画面遷移図に定義された遷移を一通りたどれる', async ({ page }) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const destinationRef = await db.collection('destinations').add({
    name: '目的地A',
    latitude: 35.1,
    longitude: 139.1,
  });
  const pickupLocationRef = await db.collection('pickupLocations').add({
    name: '集合場所A',
    latitude: 35.0,
    longitude: 139.0,
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
  const playerRef = await db.collection('players').add({
    familyId: familyRef.id,
    name: '太郎',
    schoolEntryYear: 2020,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  const existingEventRef = await db.collection('events').add({
    name: '既存の練習試合',
    date: '2026-08-01',
    destinationId: destinationRef.id,
    createdAt: now,
    updatedAt: now,
  });
  await existingEventRef.collection('responses').doc(familyRef.id).set({
    driverOutward: true,
    driverReturn: true,
    capacityToday: null,
    coachParticipating: null,
    remarks: '',
    players: [
      { playerId: playerRef.id, isParticipating: true, noOutwardRide: false, noReturnRide: false },
    ],
  });

  // 未登録ユーザーとしてホームへアクセスし、スタッフ登録してから改めてホームを開く
  await page.goto('/');
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
  await expect(page.locator('#home-page')).toBeVisible();

  // A -> F（マスタ管理） -> A（戻る）
  await page.getByRole('button', { name: 'マスタ管理' }).click();
  await page.waitForURL('**/master');
  await expect(page.locator('#master-page')).toBeVisible();
  await page.getByRole('button', { name: '戻る' }).click();
  await page.waitForURL('**/');
  await expect(page.locator('#home-page')).toBeVisible();

  // A -> B（イベント作成） -> A（保存）
  await page.getByRole('button', { name: '+ イベント作成' }).click();
  await page.waitForURL('**/events/new');
  await page.getByLabel('イベント名').fill('新規練習試合');
  await page.getByLabel('日付').fill('2026-08-10');
  await page.getByLabel('目的地').selectOption(destinationRef.id);
  await page.getByRole('button', { name: '保存' }).click();
  await page.waitForURL('**/');
  const newCard = page.locator('#home-page').getByText('新規練習試合');
  await expect(newCard).toBeVisible();

  // A -> G（編集アイコンからイベント情報編集） -> A（キャンセル）
  const newCardContainer = page.locator('.event-card', { hasText: '新規練習試合' });
  await newCardContainer.getByRole('button', { name: 'イベント情報を編集' }).click();
  await page.waitForURL(/\/events\/.+\/edit-info$/);
  await page.getByRole('button', { name: 'キャンセル' }).click();
  await page.waitForURL('**/');
  await expect(page.locator('#home-page')).toBeVisible();

  // A -> C（既存イベントのカードをタップして配車画面メインへ）
  const existingCard = page.locator(`#event-card-${existingEventRef.id}`);
  await existingCard.getByText('既存の練習試合').click();
  await page.waitForURL(`**/events/${existingEventRef.id}/carpool`);
  await expect(page.locator('#carpool-page')).toBeVisible();

  // C -> D（回答編集） -> C（戻る）
  await page.getByRole('button', { name: '回答編集' }).click();
  await page.waitForURL(`**/events/${existingEventRef.id}/edit`);
  await expect(page.locator('#event-edit-page')).toBeVisible();
  await page.getByRole('button', { name: '戻る' }).click();
  await page.waitForURL(`**/events/${existingEventRef.id}/carpool`);
  await expect(page.locator('#carpool-page')).toBeVisible();

  // C -> D（回答編集） -> C（自動配車）
  await page.getByRole('button', { name: '回答編集' }).click();
  await page.waitForURL(`**/events/${existingEventRef.id}/edit`);
  await page.getByRole('button', { name: '自動配車', exact: true }).click();
  await page.waitForURL(`**/events/${existingEventRef.id}/carpool`);
  await expect(page.locator('#carpool-page')).toBeVisible();

  // C -> A（戻る）
  await page.getByRole('button', { name: '戻る' }).click();
  await page.waitForURL('**/');
  await expect(page.locator('#home-page')).toBeVisible();
});

/**
 * 未登録ユーザーが画面遷移図に含まれる各画面のURLへ直接アクセスした場合、
 * いずれの画面も表示されず利用申請画面のみが表示されることを確認する（T08の挙動）。
 */
test('未登録ユーザーは各画面のURLへ直接アクセスしても利用申請画面のみが表示される', async ({
  page,
}) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const destinationRef = await db.collection('destinations').add({
    name: '目的地A',
    latitude: 35.1,
    longitude: 139.1,
  });
  const eventRef = await db.collection('events').add({
    name: '練習試合',
    date: '2026-08-01',
    destinationId: destinationRef.id,
    createdAt: now,
    updatedAt: now,
  });

  const paths = [
    '/',
    '/master',
    '/events/new',
    `/events/${eventRef.id}/edit-info`,
    `/events/${eventRef.id}/carpool`,
    `/events/${eventRef.id}/edit`,
  ];

  for (const path of paths) {
    await page.goto(path);
    await expect(page.locator('#request-access-container')).toBeVisible();
    await expect(page.locator('#home-page')).toHaveCount(0);
    await expect(page.locator('#master-page')).toHaveCount(0);
    await expect(page.locator('#carpool-page')).toHaveCount(0);
    await expect(page.locator('#event-edit-page')).toHaveCount(0);
  }
});
