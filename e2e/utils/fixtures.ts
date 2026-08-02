import { test as base, expect } from '@playwright/test';
import { EMULATOR_PROJECT_ID } from './constants';

const FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

/**
 * 初回利用ガイド（src/hooks/useTutorialGuide.ts）が表示済みかどうかを
 * localStorageに保存する際のキー。値はuseTutorialGuide.tsのTUTORIAL_SEEN_KEYと一致させる。
 */
const TUTORIAL_SEEN_KEY = 'tutorialSeen';

/**
 * Firestore Emulatorの全データを削除する。
 * families等のマスタデータはイベントに紐づかずグローバルに保持されるため、
 * クリアしないと前のテストで作成した家庭・選手が「未回答」として後続テストに
 * 混入し、警告メッセージのアサーションが不安定になる（各specファイルはテスト間の
 * データ分離を前提に書かれているが、Firestore Emulator自体はテストをまたいで
 * データを保持し続けるため、テスト側で明示的にクリアする必要がある）。
 */
async function clearFirestore(): Promise<void> {
  await fetch(
    `http://${FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${EMULATOR_PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' }
  );
}

/**
 * 全E2Eテスト共通のtest。各テスト開始前にFirestore Emulatorのデータをクリアする
 * auto fixtureを追加した@playwright/testのtestのラッパー。specファイルからは
 * `@playwright/test`の代わりに本モジュールからtest・expectをimportする。
 */
export const test = base.extend<{ clearFirestore: void; skipTutorial: void }>({
  clearFirestore: [
    // eslint-disable-next-line no-empty-pattern -- Playwrightのfixture関数は第1引数（未使用の依存fixture群）を省略できない
    async ({}, use) => {
      await clearFirestore();
      await use();
    },
    { auto: true },
  ],
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
