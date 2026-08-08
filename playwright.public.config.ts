import { defineConfig, devices } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:5174';

/**
 * 公開版（Dexie/IndexedDB）E2Eテスト実行基盤の設定。
 * 自チーム版（playwright.config.ts）とは異なり、Firebase Emulatorは不要。
 * Vite開発サーバーを`--mode public-e2e`で起動するだけでよい
 * （自チーム版のE2E用サーバー（ポート5173）と衝突しないよう5174を使う）。
 * ref: docs/10_DexieRepository実装設計.md#8 公開版E2Eテスト設計
 */
export default defineConfig({
  testDir: './e2e-public',
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
  webServer: {
    // --hostを明示しないとVite開発サーバーは"localhost"にバインドする。
    // 環境によっては"localhost"がIPv6（::1）に解決されIPv4（127.0.0.1）で
    // 待ち受けないことがあり、BASE_URL（127.0.0.1）への疎通確認が永久に失敗する。
    // そのためIPv4アドレスを明示的に指定する（playwright.config.tsと同じ理由）。
    command: 'npm run dev -- --mode public-e2e --host 127.0.0.1 --port 5174',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
