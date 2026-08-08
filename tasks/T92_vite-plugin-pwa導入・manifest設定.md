# 対象設計書

ref: docs/11_PWA化設計.md#3, #4, #6

# ゴール

`vite-plugin-pwa`を導入し、manifest・Service Worker生成を配線する。
公開版はフルオフライン対応、自チーム版はインストール可能にするだけ、と
mode別にWorkbox設定を出し分ける。

# 変更対象ファイル

- `vite.config.ts`
- `package.json`（`vite-plugin-pwa`を`devDependencies`に追加）
- `.gitignore`（`dev-dist/`を追加）

# 実装範囲（やること）

- `vite-plugin-pwa`を`devDependencies`に追加する
- `vite.config.ts`の`plugins`に`VitePWA(...)`を追加する
  - `registerType: 'autoUpdate'`
  - `includeAssets`に既存favicon関連ファイル（`favicon.svg`・`favicon-32x32.png`・
    `favicon-16x16.png`・`apple-touch-icon.png`）を指定する
  - `manifest`はdocs/11_PWA化設計.md#4の内容（name・short_name・description・
    theme_color・background_color・display・start_url・scope・icons）をそのまま使う
    （iconsはT91で生成した`pwa-192x192.png`・`pwa-512x512.png`を参照する）
  - `workbox`は既存の`isPublicMode`判定を流用し、
    - 公開版（`isPublicMode === true`）: `globPatterns: ['**/*.{js,css,html,svg,png,ico}']`
    - 自チーム版: `globPatterns: []`
    をそれぞれ設定する
- `.gitignore`に`dev-dist/`（vite-plugin-pwaの開発時ビルド出力ディレクトリ）を追加する

# 実装範囲外（やらないこと・触らないこと）

- `src/main.tsx`でのService Worker登録処理（`registerSW()`の呼び出し）はT93で行う
- maskable icon対応は行わない
- `.github/workflows/firebase-deploy.yml`の変更は行わない
  （このタスクではビルド設定のみを対象とし、デプロイパイプラインには触れない）

# 受け入れ条件（完了判定基準）

- `npm run build`実行後、`dist/`に`manifest.webmanifest`・Service Worker本体
  （`sw.js`等）・`registerSW.js`が生成されている
- `npm run build:public`実行後も同様に生成されている
- `npm run build`（自チーム版）の`dist/`内Service Workerの事前キャッシュ対象
  （precache manifest）が空、または最小限であることを確認する
  （`isPublicMode === false`時に`globPatterns: []`が効いていること）
- `npm run build:public`（公開版）の`dist/`内Service Workerの事前キャッシュ対象に
  主要な静的アセット（JS/CSS/HTML）が含まれていることを確認する
- `npx eslint .`がエラーなく通る
- `npx tsc -b`が既存の型エラーを増やさない

# 依存タスク

- T91（manifestのiconsがT91の生成物`pwa-192x192.png`・`pwa-512x512.png`を参照するため）
