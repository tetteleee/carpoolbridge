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
