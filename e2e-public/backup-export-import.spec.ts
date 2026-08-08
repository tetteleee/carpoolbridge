import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test, expect } from './utils/fixtures';
import { waitForDexieDb, seedPickupLocation, getAllRecords } from './utils/seedDexie';

/**
 * 公開版（Dexie/IndexedDB）のデータバックアップ（書き出し・読み込み）を検証するE2Eテスト。
 * ref: docs/04_画面設計.md#10.5 データのバックアップ画面
 * ref: docs/12_データバックアップ機能設計.md#5 インポート時の処理方針
 * ref (自チーム版の対応するテスト): e2e/backup-export-import.spec.ts
 */
test('バックアップの書き出し・読み込みで、現在のデータを丸ごと置き換えられる', async ({ page }) => {
  await page.goto('/');
  await waitForDexieDb(page);
  const locationId = await seedPickupLocation(page, { name: 'E2E公開版_集合場所A' });

  // 登録情報ハブ画面から遷移できることを確認する
  await page.goto('/master');
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
  await seedPickupLocation(page, { name: 'E2E公開版_あとから追加' });

  // 読み込み（確認ダイアログ経由）
  await page.locator('input[type=file]').setInputFiles(filePath);
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('バックアップを読み込みますか？')).toBeVisible();
  await page.getByRole('button', { name: '読み込む' }).click();

  // 読み込み完了後はホーム画面へ遷移し、完了メッセージが表示される
  await page.waitForURL('/');
  await expect(page.getByText('データを読み込みました')).toBeVisible();

  // 「あとから追加」した分は消え、書き出し時点の内容だけが残っている
  const locations = await getAllRecords<{ id: string; name: string }>(page, 'pickupLocations');
  expect(locations).toHaveLength(1);
  expect(locations[0]).toMatchObject({ id: locationId, name: 'E2E公開版_集合場所A' });
});

test('形式が不正なファイルを読み込むとエラーになり、データは変更されない', async ({ page }) => {
  await page.goto('/');
  await waitForDexieDb(page);
  await seedPickupLocation(page, { name: 'E2E公開版_変更されないはず' });

  await page.goto('/master/backup');

  const invalidFilePath = path.join(os.tmpdir(), `invalid-backup-${Date.now()}.json`);
  fs.writeFileSync(invalidFilePath, JSON.stringify({ schemaVersion: 999 }));

  await page.locator('input[type=file]').setInputFiles(invalidFilePath);
  await expect(
    page.getByText('このファイルは読み込めません（形式が正しくありません）')
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  const locations = await getAllRecords(page, 'pickupLocations');
  expect(locations).toHaveLength(1);
});
