import { test, expect } from './utils/fixtures';
import { waitForDexieDb, seedDestination, seedEvent } from './utils/seedDexie';

/**
 * 過去イベントの「もっと見る」ページネーション（getPastEventsPageのメモリ上カーソル実装、
 * ref: docs/10_DexieRepository実装設計.md#4）が、重複・漏れなく機能することを検証するE2Eテスト。
 *
 * ページサイズ（20件）は src/repositories/CarpoolRepository.ts の
 * PAST_EVENTS_PAGE_SIZE と一致させること。ページをまたぐ挙動を検証するため、
 * ページサイズを3件超える23件を投入する。
 */
const PAST_EVENTS_PAGE_SIZE = 20;
const TOTAL_EVENTS = PAST_EVENTS_PAGE_SIZE + 3;

test('過去のイベントを「もっと見る」でたどると、全件が重複・漏れなく表示される', async ({ page }) => {
  await page.goto('/');
  await waitForDexieDb(page);

  const destinationId = await seedDestination(page, { name: '目的地A' });

  const eventIds: string[] = [];
  for (let i = 1; i <= TOTAL_EVENTS; i++) {
    const day = String(i).padStart(2, '0');
    const id = await seedEvent(page, {
      name: `過去イベント${day}`,
      // 実行時の日付に関わらず必ず過去日付になるよう、十分に古い日付を使う
      date: `2020-01-${day}`,
      destinationId,
    });
    eventIds.push(id);
  }

  await page.reload();
  await expect(page.locator('#event-list')).toBeVisible();
  await expect(page.locator('#event-list-past-toggle')).toContainText(
    `過去のイベント（${TOTAL_EVENTS}件）`
  );

  // トグルを開くと1ページ目（20件）が自動取得される
  await page.click('#event-list-past-toggle');
  const loadMoreButton = page.locator('#event-list-past-load-more');

  const collectedIds = new Set<string>();
  for (const id of eventIds) {
    if (await page.locator(`#event-card-${id}`).isVisible()) {
      collectedIds.add(id);
    }
  }
  expect(collectedIds.size).toBe(PAST_EVENTS_PAGE_SIZE);
  await expect(loadMoreButton).toBeVisible();

  // 2ページ目（残り3件）を取得する
  await loadMoreButton.click();
  await expect(loadMoreButton).toHaveCount(0);

  for (const id of eventIds) {
    await expect(page.locator(`#event-card-${id}`)).toBeVisible();
    collectedIds.add(id);
  }

  // 重複なく全件（23件）が表示されていることを確認する
  expect(collectedIds.size).toBe(TOTAL_EVENTS);
});
