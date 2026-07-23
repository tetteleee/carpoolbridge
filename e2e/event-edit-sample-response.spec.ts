import { test, expect } from '@playwright/test';
import { Timestamp } from 'firebase-admin/firestore';
import { getEmulatorFirestore } from './utils/firebaseAdmin';

/**
 * イベント編集（回答入力）画面の開発用機能「サンプル回答生成」（T31）を検証するE2Eテスト。
 */
test('サンプル回答生成ボタンと確認ダイアログ', async ({ page }) => {
  const db = getEmulatorFirestore();
  const now = Timestamp.now();

  const pickupLocationRef = await db.collection('pickupLocations').add({
    name: '集合場所A',
    latitude: 35.0,
    longitude: 139.0,
  });
  const destinationRef = await db.collection('destinations').add({
    name: '目的地A',
    latitude: 35.1,
    longitude: 139.1,
  });
  const familyRef = await db.collection('families').add({
    familyName: '山田家',
    coachName: '山田父',
    vehicleCapacity: 5,
    pickupLocationId: pickupLocationRef.id,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  const childRef = await db.collection('children').add({
    familyId: familyRef.id,
    name: '太郎',
    schoolEntryYear: 2020,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  const eventRef = await db.collection('events').add({
    name: '練習試合',
    date: '2026-08-01',
    destinationId: destinationRef.id,
    createdAt: now,
    updatedAt: now,
  });

  const existingRemarksMarker = '削除される旧回答マーカー';
  const responseDocRef = eventRef.collection('responses').doc(familyRef.id);
  await responseDocRef.set({
    driverOutward: false,
    driverReturn: false,
    capacityToday: null,
    coachParticipating: null,
    remarks: existingRemarksMarker,
    children: [
      { childId: childRef.id, isParticipating: false, noOutwardRide: false, noReturnRide: false },
    ],
  });

  await page.goto(`/events/${eventRef.id}/edit`);
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();

  await expect(page.locator(`#family-response-card-${familyRef.id}`)).toBeVisible();

  const sampleResponseButton = page.getByRole('button', { name: 'サンプル回答生成' });
  await expect(sampleResponseButton).toBeVisible();

  // 押下時に確認ダイアログを表示する
  await sampleResponseButton.click();
  await expect(page.getByRole('heading', { name: 'サンプル回答を生成' })).toBeVisible();
  await expect(page.getByText('対象イベントの既存回答は削除されます。')).toBeVisible();

  // 「キャンセル」選択時：既存回答は変更されない
  await page.getByRole('button', { name: 'キャンセル' }).click();
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  expect((await responseDocRef.get()).data()?.remarks).toBe(existingRemarksMarker);

  // 「実行」選択時：既存回答を削除したうえでランダムな回答を生成・登録する
  await sampleResponseButton.click();
  await page.getByRole('button', { name: '実行' }).click();
  await expect(page.getByText('サンプル回答を生成しました')).toBeVisible();

  // 生成処理は登録済みの全家庭を対象とするため（他テストが並行投入した家庭も含まれ得る）、
  // 件数ではなく対象家庭自身のドキュメントの中身のみを検証する
  const generatedSnapshot = await responseDocRef.get();
  expect(generatedSnapshot.exists).toBe(true);
  const generated = generatedSnapshot.data();
  // サンプル文言候補に既存マーカーは含まれないため、置き換えられていれば必ず一致しない
  expect(generated?.remarks).not.toBe(existingRemarksMarker);
  expect(generated?.children).toEqual([
    expect.objectContaining({ childId: childRef.id }),
  ]);
});
