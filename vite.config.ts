import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
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
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@repository': path.resolve(
        __dirname,
        mode === 'public'
          ? 'src/repositories/dexie/index.ts'
          : 'src/repositories/firestore/index.ts'
      ),
      '@app-shell': path.resolve(
        __dirname,
        mode === 'public'
          ? 'src/appShell/PublicAppShell.tsx'
          : 'src/appShell/CloudAppShell.tsx'
      ),
    },
  },
}))
