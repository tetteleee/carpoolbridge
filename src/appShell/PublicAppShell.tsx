import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from '../router';

/**
 * 公開版のアプリ全体シェル。
 * 公開版は個人情報をサーバーへ送らない設計のため認証機構を持たず、
 * 匿名認証・staffUsers確認（firebase/auth・firebase/firestore依存）を一切行わない。
 * ref: docs/08_公開版アーキテクチャ設計.md#2, docs/10_DexieRepository実装設計.md#6
 *
 * `@app-shell`エイリアス（vite.config.ts）経由でApp.tsxから使われ、
 * 公開版ビルド（--mode public）ではこのファイルが解決先になる。
 */
export function AppShell() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
