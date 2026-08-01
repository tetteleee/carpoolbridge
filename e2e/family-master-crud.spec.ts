import { test, expect } from './utils/fixtures';
import { Timestamp } from 'firebase-admin/firestore';
import { getEmulatorFirestore } from './utils/firebaseAdmin';

/**
 * 家庭編集画面の「家族」セクション（選手・コーチ以外で配車の対象になり得る人）のCRUDを検証するE2Eテスト。
 * ref: docs/04_画面設計.md#10.4 家庭編集画面, docs/05_データ設計.md#5 FamilyMember
 */

async function registerAsStaffAndReload(page: import('@playwright/test').Page) {
  await expect(page.locator('#request-access-container')).toBeVisible();
  const uid = (await page.locator('#request-access-uid-value').textContent())?.trim();
  const db = getEmulatorFirestore();
  await db.collection('staffUsers').doc(uid as string).set({});
  await page.reload();
  return db;
}

test('家庭編集画面で家族を追加・保存すると、familyMembersコレクションに反映される（人数の上限なし）', async ({
  page,
}) => {
  await page.goto('/master/families');
  const db = await registerAsStaffAndReload(page);
  await expect(page.locator('#family-section')).toBeVisible();

  const pickupLocationRef = await db.collection('pickupLocations').add({
    name: `E2E集合場所_${Date.now()}`,
    latitude: 35.0,
    longitude: 139.0,
  });
  // 家庭編集画面は表示時点で読み込み済みの集合場所を選択肢に使うため、
  // Firestoreへ直接投入した集合場所を反映させるには再読み込みが必要
  await page.reload();
  await expect(page.locator('#family-section')).toBeVisible();

  const familyName = `E2Eテスト家庭_${Date.now()}`;
  const memberNameA = `E2E祖母_${Date.now()}`;
  const memberNameB = `E2E兄_${Date.now()}`;

  await page.getByRole('button', { name: '+ 家庭を追加' }).click();
  const newFamilyCard = page.locator('#family-list > *').last();
  await newFamilyCard.getByLabel('家庭名').fill(familyName);

  const pickupLocationName = (await pickupLocationRef.get()).data()?.name as string;
  await newFamilyCard.getByLabel('集合場所').selectOption({ label: pickupLocationName });

  // 人数の上限がないことを確認するため、2人続けて追加する
  const addFamilyMemberButton = newFamilyCard.getByRole('button', { name: '+ 家族を追加' });
  await addFamilyMemberButton.click();
  await newFamilyCard.locator('#family-member-section input[type="text"]').last().fill(memberNameA);
  await addFamilyMemberButton.click();
  await newFamilyCard.locator('#family-member-section input[type="text"]').last().fill(memberNameB);

  const saveButton = page.getByRole('button', { name: /^保存/ });
  await saveButton.click();
  await expect(saveButton).toHaveText('保存');

  const savedFamilySnapshot = await db
    .collection('families')
    .where('familyName', '==', familyName)
    .get();
  expect(savedFamilySnapshot.empty).toBe(false);
  const familyId = savedFamilySnapshot.docs[0].id;

  const savedMembersSnapshot = await db
    .collection('familyMembers')
    .where('familyId', '==', familyId)
    .get();
  const savedMembers = savedMembersSnapshot.docs.map((d) => d.data());
  expect(savedMembers).toHaveLength(2);
  expect(savedMembers).toContainEqual(
    expect.objectContaining({ name: memberNameA, familyId, isActive: true })
  );
  expect(savedMembers).toContainEqual(
    expect.objectContaining({ name: memberNameB, familyId, isActive: true })
  );

  // 保存後は一覧が再取得・再ソートされるため、末尾に留まる保証はない。
  // 家庭名で改めて対象行を特定し、折りたたみ行のメタ表示に「家族2名」が反映されることを確認する
  // （選手0名のため「選手0名」は表示されるが、家族が1人以上いる場合のみ「・家族N名」が追加表示される仕様。04_画面設計.md#10.4参照）
  const savedFamilyCard = page.locator('#family-list > *').filter({ hasText: familyName });
  await expect(savedFamilyCard.getByText(`家族${savedMembers.length}名`)).toBeVisible();
});

test('家族の在籍中トグルをOFFにして保存すると、isActiveがfalseで更新される', async ({ page }) => {
  await page.goto('/master/families');
  const db = await registerAsStaffAndReload(page);
  await expect(page.locator('#family-section')).toBeVisible();

  const pickupLocationRef = await db.collection('pickupLocations').add({
    name: `E2E集合場所_${Date.now()}`,
    latitude: 35.0,
    longitude: 139.0,
  });
  const now = Timestamp.now();
  const familyName = `E2E在籍テスト家庭_${Date.now()}`;
  const familyRef = await db.collection('families').add({
    familyName,
    vehicleCapacity: 2,
    pickupLocationId: pickupLocationRef.id,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  const memberName = `E2E退会家族_${Date.now()}`;
  const memberRef = await db.collection('familyMembers').add({
    familyId: familyRef.id,
    name: memberName,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  await page.reload();
  await expect(page.locator('#family-section')).toBeVisible();

  // Firestoreへ直接投入した家庭は折りたたまれた状態で表示されるため、
  // 家族の名前・在籍トグルは展開しないとDOMに現れない（ヘッダー行をタップして展開する）
  const familyCard = page.locator('#family-list > *').filter({ hasText: familyName });
  await familyCard.getByRole('button').first().click();
  // 家族の名前は<input>の値として表示されるため、getByTextではなくtoHaveValueで確認する
  await expect(familyCard.locator('#family-member-section input[type="text"]')).toHaveValue(memberName);
  await familyCard.getByRole('switch', { name: `${memberName}の在籍状態` }).click();

  const saveButton = page.getByRole('button', { name: /^保存/ });
  await saveButton.click();
  await expect(saveButton).toHaveText('保存');

  await expect
    .poll(async () => (await memberRef.get()).data()?.isActive)
    .toBe(false);
});

test('家庭を無効化して保存しても家族本人のisActiveは変更されず、家庭が無効な間は家族の在籍中トグルが操作不可になる', async ({ page }) => {
  await page.goto('/master/families');
  const db = await registerAsStaffAndReload(page);
  await expect(page.locator('#family-section')).toBeVisible();

  const pickupLocationRef = await db.collection('pickupLocations').add({
    name: `E2E集合場所_${Date.now()}`,
    latitude: 35.0,
    longitude: 139.0,
  });
  const now = Timestamp.now();
  const familyName = `E2E卒団テスト家庭_${Date.now()}`;
  const familyRef = await db.collection('families').add({
    familyName,
    vehicleCapacity: 2,
    pickupLocationId: pickupLocationRef.id,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  const memberName = `E2E連動卒団家族_${Date.now()}`;
  const memberRef = await db.collection('familyMembers').add({
    familyId: familyRef.id,
    name: memberName,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  await page.reload();
  await expect(page.locator('#family-section')).toBeVisible();

  // 家庭自身の「在籍中」トグルは展開後の本文にあるため、まずヘッダー行をタップして展開する
  const familyCard = page.locator('#family-list > *').filter({ hasText: familyName });
  await familyCard.getByRole('button').first().click();
  await familyCard.getByRole('switch', { name: `${familyName}の在籍状態` }).click();

  const saveButton = page.getByRole('button', { name: /^保存/ });
  await saveButton.click();
  await expect(saveButton).toHaveText('保存');

  // 家庭のisActiveをfalseにしても、家族本人のisActiveは書き換わらない
  // （除外判定は「家庭isActive AND 本人isActive」のAND条件で行うため。05_データ設計.md#3 Family参照）
  await expect
    .poll(async () => (await memberRef.get()).data()?.isActive)
    .toBe(true);

  // 保存すると最新データで再マウントされ、家庭カードは折りたたみ状態に戻るため再度展開する
  await familyCard.getByRole('button').first().click();

  // 家庭が無効な間は、家族の在籍中トグルを操作不可（disabled）にする（04_画面設計.md#10.4）
  await expect(
    familyCard.getByRole('switch', { name: `${memberName}の在籍状態` })
  ).toBeDisabled();
});
