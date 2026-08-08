import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test, expect } from './utils/fixtures';
import { getEmulatorFirestore } from './utils/firebaseAdmin';

/**
 * 自チーム版（Firestore）のデータバックアップ（書き出し・読み込み）を検証するE2Eテスト。
 * ref: docs/04_画面設計.md#10.5 データのバックアップ画面
 * ref: docs/12_データバックアップ機能設計.md#5 インポート時の処理方針
 * ref (公開版の対応するテスト): e2e-public/backup-export-import.spec.ts
 *
 * 注意: このファイルの各テストはpickupLocationsコレクションを丸ごと削除する
 * （インポートによる全置換）ため、他のspecファイルが同じFirestore Emulator
 * プロジェクトへ同時に書き込んでいると、そのテストのデータまで巻き込んで
 * 消してしまう可能性がある。playwright.config.tsはCI実行時のみworkers=1
 * （逐次実行）に固定しており、CIでは他テストと同時実行されないため問題ない。
 * ローカルでフルスイート（`npm run test:e2e`、workers未指定＝並列）を実行する際は
 * 稀にこのファイルが原因で無関係なテストが失敗することがありうる
 * （`npm run test:e2e -- --workers=1`で回避可能）。
 */

async function registerAsStaffAndReload(page: import('@playwright/test').Page) {
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  const db = getEmulatorFirestore();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
  return db;
}

test('バックアップの書き出し・読み込みで、チームの現在のデータを丸ごと置き換えられる', async ({
  page,
}) => {
  await page.goto('/master');
  const db = await registerAsStaffAndReload(page);

  const locationId = `e2e-location-${Date.now()}`;
  await db.collection('pickupLocations').doc(locationId).set({
    name: 'E2E自チーム版_集合場所A',
    latitude: null,
    longitude: null,
  });

  // 登録情報ハブ画面から遷移できることを確認する
  await page.getByText('データのバックアップ').click();
  await expect(page).toHaveURL(/\/master\/backup$/);

  // 書き出し
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'バックアップを書き出す' }).click(),
  ]);
  await expect(page.getByText('バックアップを書き出しました')).toBeVisible();
  const filePath = await download.path();
  if (!filePath) {
    throw new Error('ダウンロードファイルのパスが取得できませんでした');
  }

  // 書き出し後に追加したデータは、読み込みで消えるはず
  const extraId = `e2e-location-extra-${Date.now()}`;
  await db.collection('pickupLocations').doc(extraId).set({
    name: 'E2E自チーム版_あとから追加',
    latitude: null,
    longitude: null,
  });

  // 読み込み（確認ダイアログ経由。自チーム版向けの警告文言も確認する）
  await page.locator('input[type=file]').setInputFiles(filePath);
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('バックアップを読み込みますか？')).toBeVisible();
  await expect(page.getByText('この操作はチーム全員のデータに反映されます')).toBeVisible();
  await page.getByRole('button', { name: '読み込む' }).click();

  // 読み込み完了後はホーム画面へ遷移し、完了メッセージが表示される
  await page.waitForURL('/');
  await expect(page.getByText('データを読み込みました')).toBeVisible();

  // 「あとから追加」した分は消え、書き出し時点の内容だけが残っている
  const snapshot = await db.collection('pickupLocations').get();
  expect(snapshot.docs).toHaveLength(1);
  expect(snapshot.docs[0].id).toBe(locationId);
  expect(snapshot.docs[0].data().name).toBe('E2E自チーム版_集合場所A');

  // staffUsers（認証情報）はclearAllDataの対象外のため、読み込み後も認証状態が保たれる
  await page.goto('/master');
  await expect(page.locator('#master-page')).toBeVisible();
});

test('形式が不正なファイルを読み込むとエラーになり、データは変更されない', async ({ page }) => {
  await page.goto('/master');
  const db = await registerAsStaffAndReload(page);

  const locationId = `e2e-location-${Date.now()}`;
  await db.collection('pickupLocations').doc(locationId).set({
    name: 'E2E自チーム版_変更されないはず',
    latitude: null,
    longitude: null,
  });

  await page.getByText('データのバックアップ').click();
  await expect(page).toHaveURL(/\/master\/backup$/);

  const invalidFilePath = path.join(os.tmpdir(), `invalid-backup-${Date.now()}.json`);
  fs.writeFileSync(invalidFilePath, JSON.stringify({ schemaVersion: 999 }));

  await page.locator('input[type=file]').setInputFiles(invalidFilePath);
  await expect(
    page.getByText('このファイルは読み込めません（形式が正しくありません）')
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  const snapshot = await db.collection('pickupLocations').get();
  expect(snapshot.docs).toHaveLength(1);
});
