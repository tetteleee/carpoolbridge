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
    },
  },
}))
