import { test, expect } from './utils/fixtures';
import { getEmulatorFirestore } from './utils/firebaseAdmin';

/**
 * 初回利用ガイド（チュートリアル）の手動再表示を検証するE2Eテスト。
 * 自動表示の判定（初回のみ）はfixtures.tsのskipTutorial fixtureにより
 * 全テスト共通で無効化されているため、本specはホーム画面の？ボタンからの
 * 再表示のみを対象とする。
 * ref: docs/04_画面設計.md#5.1 初回利用ガイド（チュートリアル） 再表示
 */

async function registerAsStaffAndReload(page: import('@playwright/test').Page) {
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  const db = getEmulatorFirestore();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
}

test('ホーム画面の？ボタンから初回利用ガイドを再表示・終了できる', async ({ page }) => {
  await page.goto('/');
  await registerAsStaffAndReload(page);
  await expect(page.locator('#home-page')).toBeVisible();

  // skipTutorial fixtureにより自動表示はされていない
  await expect(page.getByRole('dialog', { name: '初回利用ガイド' })).toBeHidden();

  // ？ボタンから再表示
  await page.getByRole('button', { name: '使い方を見る' }).click();
  const dialog = page.getByRole('dialog', { name: '初回利用ガイド' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('集合場所・目的地・家庭を登録')).toBeVisible();

  // スキップで閉じられる
  await dialog.getByRole('button', { name: 'スキップ' }).click();
  await expect(dialog).toBeHidden();

  // 再度開き、最終ステップまで進めて「はじめる」で閉じられる
  await page.getByRole('button', { name: '使い方を見る' }).click();
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 5; i++) {
    await dialog.getByRole('button', { name: '次へ' }).click();
  }
  await dialog.getByRole('button', { name: 'はじめる' }).click();
  await expect(dialog).toBeHidden();

  // 閉じた後も、何度でも？ボタンから開ける
  await page.getByRole('button', { name: '使い方を見る' }).click();
  await expect(dialog).toBeVisible();
});
