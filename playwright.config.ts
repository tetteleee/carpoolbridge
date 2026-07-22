import { defineConfig, devices } from '@playwright/test';
import { EMULATOR_PROJECT_ID } from './e2e/utils/constants';

const BASE_URL = 'http://127.0.0.1:5173';

/**
 * E2Eテスト実行基盤の設定。
 * Firebase Emulator Suite（Auth・Firestore）とVite開発サーバーを
 * webServerとして自動起動し、その上でテストを実行する。
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      // Firestoreは起動直後にポートが開くが、Authはそれより遅れて開く。
      // 両方の起動完了を待つため、より遅く開くAuth（9099）を起動完了の判定に使う。
      command: `npx firebase emulators:start --only auth,firestore --project ${EMULATOR_PROJECT_ID}`,
      port: 9099,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      // firebase-toolsはFirestore Emulator（Java）をdetached: trueで起動しており、
      // 別プロセスグループに属するため、Playwright標準のSIGKILLでは終了できず残り続ける。
      // firebase-tools自身はSIGTERM/SIGINTを受けると子プロセスを含めて正しく終了する処理を
      // 持っているため、まずSIGTERMで猶予を与え、それでも終了しない場合のみSIGKILLする。
      gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
      // firebase-toolsは通常ログ（起動失敗の理由を含む）をstdoutに出す。
      // Playwrightはデフォルトでは（reporter: 'html'環境下では特に）webServerの
      // stdoutをCIログへ転送しないため、起動失敗時に原因が完全に握りつぶされる。
      // stdout: 'pipe'を明示することで、失敗時の実際のログをCI上で確認できるようにする。
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev -- --mode e2e',
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
