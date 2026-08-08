import { test as base, expect } from '@playwright/test';

/**
 * 初回利用ガイド（src/hooks/useTutorialGuide.ts）が表示済みかどうかを
 * localStorageに保存する際のキー。値はuseTutorialGuide.tsのTUTORIAL_SEEN_KEYと一致させる。
 */
const TUTORIAL_SEEN_KEY = 'tutorialSeen';

/**
 * 公開版E2Eテスト共通のtest。
 *
 * 自チーム版（e2e/utils/fixtures.ts）と異なり、Firestore Emulatorのデータクリアに相当する
 * 処理は不要。Playwrightは既定で各テストに新しいBrowserContext（＝新しいIndexedDB）を
 * 割り当てるため、テスト間のデータ分離は自動的に確保される
 * （ref: docs/10_DexieRepository実装設計.md#8）。
 */
export const test = base.extend<{ skipTutorial: void }>({
  // 各specは実際の機能検証が目的であり、初回利用ガイドの検証が目的ではないため、
  // 既読状態にしてホーム画面の操作をガイドに妨げられないようにする。
  skipTutorial: [
    async ({ page }, use) => {
      await page.addInitScript((key) => {
        window.localStorage.setItem(key, 'true');
      }, TUTORIAL_SEEN_KEY);
      await use();
    },
    { auto: true },
  ],
});

export { expect };
