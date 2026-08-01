import { test as base, expect } from '@playwright/test';
import { EMULATOR_PROJECT_ID } from './constants';

const FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

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
export const test = base.extend<{ clearFirestore: void }>({
  clearFirestore: [
    // eslint-disable-next-line no-empty-pattern -- Playwrightのfixture関数は第1引数（未使用の依存fixture群）を省略できない
    async ({}, use) => {
      await clearFirestore();
      await use();
    },
    { auto: true },
  ],
});

export { expect };
