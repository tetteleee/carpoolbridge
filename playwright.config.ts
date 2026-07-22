import { defineConfig, devices } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:5173';
const EMULATOR_PROJECT_ID = 'demo-carpoolbridge-e2e';

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
      command: `firebase emulators:start --only auth,firestore --project ${EMULATOR_PROJECT_ID}`,
      port: 8080,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npm run dev -- --mode e2e',
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
