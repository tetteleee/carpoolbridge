import { test, expect } from './utils/fixtures';
import {
  waitForDexieDb,
  seedPickupLocation,
  seedFamily,
  seedPlayer,
  seedCoach,
  seedFamilyMember,
  getAllRecords,
} from './utils/seedDexie';

/**
 * 家庭削除時、選手・コーチ・家族への道連れ削除カスケードが
 * Dexie上でも機能することを検証するE2Eテスト
 * （services/master/familyService.tsのdeleteFamilyがrepository.deletePlayersByFamilyId等を
 * 呼ぶ実装。ref: docs/08_公開版アーキテクチャ設計.md#7、docs/10_DexieRepository実装設計.md#8）。
 */
test('家庭を削除すると、所属する選手・コーチ・家族も道連れで削除される', async ({ page }) => {
  await page.goto('/');
  await waitForDexieDb(page);

  const pickupLocationId = await seedPickupLocation(page, { name: '集合場所A' });
  const familyId = await seedFamily(page, {
    familyName: 'E2E公開版家庭',
    vehicleCapacity: 5,
    pickupLocationId,
  });
  const playerId = await seedPlayer(page, {
    familyId,
    name: '選手A',
    schoolEntryYear: 2020,
  });
  const coachId = await seedCoach(page, { familyId, name: 'コーチA' });
  const familyMemberId = await seedFamilyMember(page, { familyId, name: '家族A' });

  await page.goto('/master/families');
  await expect(page.locator('#family-section')).toBeVisible();
  // 直接IndexedDBへ投入したデータを画面へ反映させるにはリロードが必要
  await page.reload();
  await expect(page.locator('#family-section')).toBeVisible();

  const familyRow = page.getByRole('button', { name: /E2E公開版家庭/ });
  await expect(familyRow).toBeVisible();
  await familyRow.click();

  await page.getByRole('button', { name: '家庭を削除' }).click();
  const confirmDialog = page.locator('[role="dialog"]');
  await expect(confirmDialog).toBeVisible();
  await confirmDialog.getByRole('button', { name: '削除', exact: true }).click();

  await expect(page.getByRole('button', { name: /E2E公開版家庭/ })).toHaveCount(0);

  interface HasId {
    id: string;
  }
  const players = await getAllRecords<HasId>(page, 'players');
  const coaches = await getAllRecords<HasId>(page, 'coaches');
  const familyMembers = await getAllRecords<HasId>(page, 'familyMembers');
  const families = await getAllRecords<HasId>(page, 'families');

  expect(families.some((f) => f.id === familyId)).toBe(false);
  expect(players.some((p) => p.id === playerId)).toBe(false);
  expect(coaches.some((c) => c.id === coachId)).toBe(false);
  expect(familyMembers.some((m) => m.id === familyMemberId)).toBe(false);
});
