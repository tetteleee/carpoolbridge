import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
//
// @repositoryは自チーム版(Firestore)・公開版(Dexie/IndexedDB)でデータ保存層を
// 静的に切り替えるためのエイリアス。ビルドmode（--mode public）によって解決先の
// モジュールごとバンドルから切り替わるため、片方の実装（Firebase SDK / Dexie）が
// もう片方のビルドに混入しない。
// ref: docs/10_DexieRepository実装設計.md#2 storageMode切り替え機構
// @app-shellは自チーム版・公開版でアプリ全体のシェル（認証の有無）を静的に切り替える
// エイリアス。自チーム版はFirebase Authenticationによる匿名認証・staffUsers確認を行うが、
// 公開版は個人情報をサーバーへ送らない設計のため認証機構を持たない
// （ref: docs/08_公開版アーキテクチャ設計.md#2, docs/10_DexieRepository実装設計.md#6）。
// isPublicMode: 本番の公開版（public）・公開版E2E（public-e2e）のどちらもDexie/PublicAppShellを
// 使う。E2E用のmode名を追加した際にここへの追記漏れが起きないよう、"public"で始まるmode名は
// すべて公開版として扱う（ref: docs/10_DexieRepository実装設計.md#8）。
// PWA化の設計判断（対象範囲・オフライン対応レベル・更新方式）はdocs/11_PWA化設計.md参照。
// 公開版はアプリシェルを事前キャッシュしフルオフライン対応する。自チーム版は認証・Firestore通信が
// 引き続きオンライン必須のため事前キャッシュせず、インストール可能にするだけの位置づけとする。
export default defineConfig(({ mode }) => {
  const isPublicMode = mode.startsWith('public')
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        // Service Worker登録はsrc/main.tsxでvirtual:pwa-registerのregisterSW()を
        // 明示的に呼び出す方式に一本化する（T93）。injectRegisterの自動スクリプト注入と
        // 二重の登録経路にならないよう無効化する。ref: docs/11_PWA化設計.md#7
        injectRegister: null,
        includeAssets: [
          'favicon-32x32.png',
          'favicon-16x16.png',
          'apple-touch-icon.png',
        ],
        manifest: {
          name: '配車アシスタント',
          short_name: '配車アシスタント',
          description: '学童野球チームの配車調整を効率化するアプリ',
          // UIの--accent（src/index.css）と揃える
          theme_color: '#2563eb',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
        workbox: isPublicMode
          ? { globPatterns: ['**/*.{js,css,html,svg,png,ico}'] }
          : { globPatterns: [] },
      }),
    ],
    resolve: {
      alias: {
        '@repository': path.resolve(
          __dirname,
          isPublicMode
            ? 'src/repositories/dexie/index.ts'
            : 'src/repositories/firestore/index.ts'
        ),
        '@app-shell': path.resolve(
          __dirname,
          isPublicMode
            ? 'src/appShell/PublicAppShell.tsx'
            : 'src/appShell/CloudAppShell.tsx'
        ),
      },
    },
  }
})
