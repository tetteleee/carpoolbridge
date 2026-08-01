import { test, expect } from './utils/fixtures';
import { getEmulatorFirestore } from './utils/firebaseAdmin';

/**
 * マスタ管理画面群（ハブ画面T56、集合場所・目的地・家庭の各編集画面T57〜T59）を検証するE2Eテスト。
 * ref: docs/04_画面設計.md#10 マスタ管理
 */

async function registerAsStaffAndReload(page: import('@playwright/test').Page) {
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  const db = getEmulatorFirestore();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
  return db;
}

test('マスタ管理ハブ画面のURLに直接アクセスできる', async ({ page }) => {
  await page.goto('/master');
  await registerAsStaffAndReload(page);

  await expect(page.locator('#master-page')).toBeVisible();
  await expect(page.locator('#master-page h1')).toHaveText('マスタ管理');
  await expect(page.locator('#master-menu')).toContainText('集合場所');
  await expect(page.locator('#master-menu')).toContainText('目的地');
  await expect(page.locator('#master-menu')).toContainText('家庭');
});

test('集合場所・目的地・家庭の各編集画面のURLに直接アクセスできる', async ({ page }) => {
  await page.goto('/master/pickup-locations');
  await registerAsStaffAndReload(page);
  await expect(page.locator('#pickup-location-section')).toBeVisible();
  await expect(page.getByRole('heading', { name: '集合場所', level: 1 })).toBeVisible();

  await page.goto('/master/destinations');
  await expect(page.locator('#destination-section')).toBeVisible();
  await expect(page.getByRole('heading', { name: '目的地', level: 1 })).toBeVisible();

  await page.goto('/master/families');
  await expect(page.locator('#family-section')).toBeVisible();
  await expect(page.getByRole('heading', { name: '家庭', level: 1 })).toBeVisible();
});

test('ハブ画面のメニュー行から各編集画面へ遷移できる', async ({ page }) => {
  await page.goto('/master');
  await registerAsStaffAndReload(page);

  await page.getByRole('button', { name: /集合場所/ }).click();
  await page.waitForURL('**/master/pickup-locations');
  await expect(page.locator('#pickup-location-section')).toBeVisible();

  await page.getByRole('button', { name: '戻る' }).click();
  await page.waitForURL('**/master');

  await page.getByRole('button', { name: /目的地/ }).click();
  await page.waitForURL('**/master/destinations');
  await expect(page.locator('#destination-section')).toBeVisible();

  await page.getByRole('button', { name: '戻る' }).click();
  await page.waitForURL('**/master');

  await page.getByRole('button', { name: /家庭/ }).click();
  await page.waitForURL('**/master/families');
  await expect(page.locator('#family-section')).toBeVisible();
});

test('未保存の編集がある状態で戻ると確認ダイアログが表示される（集合場所編集画面）', async ({
  page,
}) => {
  await page.goto('/master/pickup-locations');
  await registerAsStaffAndReload(page);
  await expect(page.locator('#pickup-location-section')).toBeVisible();

  const backButton = page.getByRole('button', { name: '戻る' });

  // 未保存の変更がなければ、確認なしでそのままハブ画面へ戻る
  await backButton.click();
  await page.waitForURL('**/master');

  await page.goto('/master/pickup-locations');
  await expect(page.locator('#pickup-location-section')).toBeVisible();

  // 集合場所を追加すると未保存の変更ありとみなされる
  await page.locator('#pickup-location-section').getByRole('button', { name: '+ 集合場所を追加' }).click();

  await backButton.click();
  await expect(page.getByRole('heading', { name: '保存されていません' })).toBeVisible();

  // 「編集を続ける」ではダイアログが閉じるだけで画面に留まる
  await page.getByRole('button', { name: '編集を続ける' }).click();
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  await expect(page.locator('#pickup-location-section')).toBeVisible();

  // 「このまま戻る」でハブ画面へ遷移する
  await backButton.click();
  await page.getByRole('button', { name: 'このまま戻る' }).click();
  await page.waitForURL('**/master');
});

test('集合場所を保存すると同じ画面に留まり、家庭編集画面の集合場所プルダウンに反映される', async ({
  page,
}) => {
  await page.goto('/master/pickup-locations');
  const db = await registerAsStaffAndReload(page);
  await expect(page.locator('#pickup-location-section')).toBeVisible();

  const locationName = `E2Eテスト集合場所_${Date.now()}`;

  // 他のE2Eテストが並行して投入した集合場所も一覧に存在しうるため、
  // 新規追加した末尾のカードに絞って入力する
  await page.locator('#pickup-location-section').getByRole('button', { name: '+ 集合場所を追加' }).click();
  await page.locator('#pickup-location-section').getByLabel('名称').last().fill(locationName);

  const saveButton = page.getByRole('button', { name: /^保存/ });
  await saveButton.click();
  // 保存処理（非同期）の完了を、ボタン表示が「保存中...」から「保存」に戻ることで待つ
  await expect(saveButton).toHaveText('保存');

  // 保存後もハブ画面へ遷移せず、同じ画面に留まる
  await expect(page).toHaveURL(/\/master\/pickup-locations$/);
  await expect(page.locator('#pickup-location-section')).toBeVisible();

  const saved = await db
    .collection('pickupLocations')
    .where('name', '==', locationName)
    .get();
  expect(saved.empty).toBe(false);

  // 家庭編集画面を開くと、保存済みの集合場所が選択肢に反映されている
  // 他のE2Eテストが投入した既存の家庭カードにも同じ選択肢が表示されうるため、
  // 新規追加した末尾の家庭カードに絞って確認する
  await page.goto('/master/families');
  await expect(page.locator('#family-section')).toBeVisible();
  await page.getByRole('button', { name: '+ 家庭を追加' }).click();
  const newFamilyCard = page.locator('#family-list > *').last();
  await expect(
    newFamilyCard.getByRole('option', { name: locationName })
  ).toHaveCount(1);
});
