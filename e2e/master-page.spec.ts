import { test, expect } from '@playwright/test';
import { getEmulatorFirestore } from './utils/firebaseAdmin';

test('マスタ管理画面のURLに直接アクセスできる', async ({ page }) => {
  // 初回アクセス時は未登録のため利用申請画面が表示される
  await page.goto('/master');
  await expect(page.locator('#request-access-container')).toBeVisible();

  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  expect(uid).toBeTruthy();

  // 本来は管理者がFirebase ConsoleからstaffUsersへ登録する操作を、
  // Admin SDK経由でFirestore Emulatorに対して再現する
  const db = getEmulatorFirestore();
  await db.collection('staffUsers').doc(uid as string).set({});

  // 再読み込み後、マスタ管理画面のURLへ直接到達できることを確認する
  await page.reload();
  await expect(page.locator('#master-page')).toBeVisible();
  await expect(page.locator('#master-page h1')).toHaveText('マスタ管理');
});

test('未保存の編集がある状態で戻ると確認ダイアログが表示される', async ({ page }) => {
  await page.goto('/master');
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  const db = getEmulatorFirestore();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
  await expect(page.locator('#master-page')).toBeVisible();

  const backButton = page.getByRole('button', { name: '戻る' });

  // 未保存の変更がなければ、確認なしでそのまま戻る
  await backButton.click();
  await page.waitForURL('**/');

  await page.goto('/master');
  await expect(page.locator('#master-page')).toBeVisible();

  // 集合場所を追加すると未保存の変更ありとみなされる
  await page.locator('#pickup-location-section').getByRole('button', { name: '+ 集合場所を追加' }).click();

  await backButton.click();
  await expect(page.getByRole('heading', { name: '保存されていません' })).toBeVisible();

  // 「編集を続ける」ではダイアログが閉じるだけで画面に留まる
  await page.getByRole('button', { name: '編集を続ける' }).click();
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  await expect(page.locator('#master-page')).toBeVisible();

  // 「このまま戻る」でホームへ遷移する
  await backButton.click();
  await page.getByRole('button', { name: 'このまま戻る' }).click();
  await page.waitForURL('**/');
});
