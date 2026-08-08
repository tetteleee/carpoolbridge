import { test, expect } from './utils/fixtures';

/**
 * 公開版（Dexie/IndexedDB）のマスタデータCRUDが、ページリロードを跨いで
 * 永続化されることを検証するE2Eテスト。
 * ref: docs/10_DexieRepository実装設計.md#8 公開版E2Eテスト設計
 * ref (自チーム版の対応するテスト): e2e/master-page.spec.ts
 */
test('集合場所を追加・保存すると、ページをリロードしても表示され続ける', async ({ page }) => {
  await page.goto('/master/pickup-locations');
  await expect(page.locator('#pickup-location-section')).toBeVisible();

  const locationName = `E2E公開版集合場所_${Date.now()}`;

  await page
    .locator('#pickup-location-section')
    .getByRole('button', { name: '+ 集合場所を追加' })
    .click();
  await page.locator('#pickup-location-section').getByLabel('名称').last().fill(locationName);

  const saveButton = page.getByRole('button', { name: /^保存/ });
  await saveButton.click();
  await expect(saveButton).toHaveText('保存');

  // IndexedDBへ永続化されていることを、ページリロード後も表示され続けることで確認する
  // （メモリ上の状態ではなくストレージへの実際の書き込みを検証する）
  await page.reload();
  await expect(page.locator('#pickup-location-section')).toBeVisible();

  // 一覧行は折りたたみ表示（CollapsibleListRow）のため、タップして展開する
  await page.getByRole('button', { name: new RegExp(locationName) }).click();

  const nameInputs = page.locator('#pickup-location-section').getByLabel('名称');
  await expect(nameInputs).toHaveCount(1);
  await expect(nameInputs.first()).toHaveValue(locationName);
});
