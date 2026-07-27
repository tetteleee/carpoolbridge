import { test, expect } from '@playwright/test';
import { Timestamp } from 'firebase-admin/firestore';
import { getEmulatorFirestore } from './utils/firebaseAdmin';

/**
 * イベント一覧の編集アイコン（T48）・イベント情報編集画面（T50・T50a）を検証するE2Eテスト。
 * 回答編集（/events/:eventId/edit）とは独立した画面であることも合わせて確認する。
 * 他のE2Eテストと同一のFirestore Emulatorを共有するため、locatorは対象イベントの
 * ドキュメントIDに紐づく要素（#event-card-{id}配下）にスコープし、他テストが並行して
 * 投入するデータと衝突しないようにする。
 */
test('イベント一覧の編集アイコンからイベント情報（名称・日付・場所）を編集できる', async ({
  page,
}) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const destinationARef = await db.collection('destinations').add({
    name: '目的地A',
    latitude: 35.1,
    longitude: 139.1,
  });
  const destinationBRef = await db.collection('destinations').add({
    name: '目的地B',
    latitude: 35.2,
    longitude: 139.2,
  });
  const eventRef = await db.collection('events').add({
    name: '練習試合',
    date: '2026-08-01',
    destinationId: destinationARef.id,
    createdAt: now,
    updatedAt: now,
  });

  await page.goto('/');
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();

  const card = page.locator(`#event-card-${eventRef.id}`);
  await expect(card).toBeVisible();
  await expect(card.getByText('練習試合')).toBeVisible();
  await expect(card.getByText('目的地A')).toBeVisible();

  // 編集アイコンからイベント情報編集画面へ遷移する
  await card.getByRole('button', { name: 'イベント情報を編集' }).click();
  await page.waitForURL(`**/events/${eventRef.id}/edit-info`);

  // 既存値が初期表示される
  await expect(page.getByLabel('イベント名')).toHaveValue('練習試合');
  await expect(page.getByLabel('日付')).toHaveValue('2026-08-01');
  await expect(page.getByLabel('場所')).toHaveValue(destinationARef.id);

  // キャンセル：変更を破棄してホームへ戻る
  await page.getByLabel('イベント名').fill('破棄されるはずの名前');
  await page.getByRole('button', { name: 'キャンセル' }).click();
  await page.waitForURL('**/');
  await expect(card.getByText('練習試合')).toBeVisible();
  await expect(page.getByText('破棄されるはずの名前')).toHaveCount(0);

  // 保存：入力内容がFirestoreへ反映され、一覧の表示にも反映される
  await card.getByRole('button', { name: 'イベント情報を編集' }).click();
  await page.waitForURL(`**/events/${eventRef.id}/edit-info`);
  await page.getByLabel('イベント名').fill('練習試合（変更後）');
  await page.getByLabel('日付').fill('2026-08-02');
  await page.getByLabel('場所').selectOption(destinationBRef.id);
  await page.getByRole('button', { name: '保存' }).click();
  await page.waitForURL('**/');

  await expect(card.getByText('練習試合（変更後）')).toBeVisible();
  await expect(card.getByText('目的地B')).toBeVisible();

  const updatedEvent = await eventRef.get();
  expect(updatedEvent.data()).toMatchObject({
    name: '練習試合（変更後）',
    date: '2026-08-02',
    destinationId: destinationBRef.id,
  });

  // カード本文タップは既存どおり配車画面へ遷移し、回答編集（回答入力）画面は変更を受けない
  await card.getByText('練習試合（変更後）').click();
  await page.waitForURL(`**/events/${eventRef.id}/carpool`);
});
