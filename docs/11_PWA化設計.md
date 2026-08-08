# 1. 目的・位置づけ

本ドキュメントは、`docs/08_公開版アーキテクチャ設計.md`・`docs/10_DexieRepository実装設計.md`で
「別資料・別フェーズで扱う」として対象外としていたPWA化を対象とする設計書である。

以下は人間による決定事項（本ドキュメント作成前に確認済み）。

- 対象範囲: **公開版・自チーム版の両方**
- 公開版のオフライン対応レベル: **フルオフライン対応**
- 実装方法: **vite-plugin-pwa**
- 新バージョンリリース時の更新方式: **自動更新**

---

# 2. 対象範囲・レベル

公開版と自チーム版で、PWA化の意味合いが異なるため対応レベルを分ける。

## 公開版（Dexie/IndexedDB版）

**フルオフライン対応**とする。アプリシェル（HTML/CSS/JS）を事前キャッシュし、
電波が悪い会場でもアプリの起動・操作を継続できるようにする。データはすでに
IndexedDBに保存されているため、オフライン対応との親和性が高い
（`CLAUDE.md`「現場で使えることを最優先」に合致）。

## 自チーム版（Firestore版）

**インストール可能にするだけ**とする。ホーム画面に追加でき、ネイティブアプリに近い
起動体験を提供するが、認証（Firebase Authentication）・Firestore通信は引き続き
オンライン必須のままとする。アプリシェルの事前キャッシュは行わない。

理由: シェルだけキャッシュしてオフラインで開けても、認証待ち・データ取得待ちの
画面で操作不能になるだけで実用性がない。むしろ古いキャッシュが残留し、
デプロイ直後の挙動確認を誤らせるリスクの方が大きい。

---

# 3. 実装方法

**vite-plugin-pwa**を導入する。

- manifest生成・Service Worker生成（Workbox）・更新検知を自動化でき、
  自前でキャッシュ戦略やアップデート処理を書く必要がない
- Viteとの統合が公式に提供されており、既存の`resolve.alias`によるmode分岐
  （`docs/10`#2参照）と同じ`vite.config.ts`内で条件分岐できる
- `CLAUDE.md`のシンプル優先・保守しやすさの方針に合致する

手書きmanifest.json + 自作Service Workerは、キャッシュ戦略・更新処理を
自前実装する必要があり保守コストが高いため不採用とした。

---

# 4. manifestデザイン

```json
{
  "name": "配車アシスタント",
  "short_name": "配車アシスタント",
  "description": "学童野球チームの配車調整を効率化するアプリ",
  "theme_color": "#3d5a80",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/",
  "scope": "/",
  "icons": [
    { "src": "pwa-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "pwa-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- `theme_color`は既存`public/favicon.svg`のブランドカラー（`#3d5a80`）を流用する
- アイコンは既存`favicon.svg`と同じ図案（車・人型シルエット）をフルキャンバス
  （余白なしでクロップしていない512×512）で書き出し、192px・512pxのPNGに
  ラスタライズする
- maskable icon（Android等のアイコン安全域対応）は本フェーズの対象外とする
  （8章参照）。視覚的な微調整が必要でありYAGNIの観点から今回は見送る

---

# 5. アイコン生成

`favicon.svg`はfavicon表示用に一部をクロップしたviewBox（`30 42 452 452`）に
なっているため、PWAアイコン用には全体（`0 0 512 512`）を使った別ソースSVGを
新規に用意する（図案・ブランドカラーは同一）。

このSVGから`sharp`（Node.jsの画像処理ライブラリ）でPNGを生成する。
一度きりの変換ではなく、将来ロゴを変更した際にも再生成できるよう、
既存の`scripts/seed/`と同様の位置づけで`scripts/generate-pwa-icons.ts`として
スクリプト化し、`sharp`は`devDependencies`に残す。

```text
scripts/
  generate-pwa-icons.ts   # 新規: public/pwa-*.pngを生成するワンショットスクリプト
public/
  pwa-icon-source.svg     # 新規: フルキャンバス版アイコンソース
  pwa-192x192.png         # 新規: 生成物（コミットする）
  pwa-512x512.png         # 新規: 生成物（コミットする）
```

生成物のPNG自体はコミットする（ビルド時に毎回生成する必要はなく、
デプロイ時の依存を増やさないため）。

---

# 6. Service Worker戦略（mode別）

`vite.config.ts`の既存`isPublicMode`分岐（`docs/10`#2参照）をそのまま流用し、
VitePWAプラグインのWorkbox設定（`generateSW`戦略）をmodeで出し分ける。

```typescript
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.svg', 'favicon-32x32.png', 'favicon-16x16.png', 'apple-touch-icon.png'],
  manifest: { /* 4章の内容 */ },
  workbox: isPublicMode
    ? {
        // 公開版: アプリシェル一式を事前キャッシュし、フルオフライン対応する
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      }
    : {
        // 自チーム版: 事前キャッシュしない（認証・Firestore通信はオンライン必須のため、
        // シェルだけキャッシュしても実用的でない。2章参照）
        globPatterns: [],
      },
})
```

`injectManifest`戦略（自前Service Workerコードを書く方式）は、キャッシュ戦略を
細かく作り込む必要がある場合向けであり、本アプリの要件（フルキャッシュ or
キャッシュなし、の二択）には過剰なため不採用とした。

---

# 7. 更新戦略

`registerType: 'autoUpdate'`（人間の決定事項）を使う。新しいService Workerが
バックグラウンドで取得され次第、次回のページ操作（ナビゲーション）時に
自動的に新バージョンへ切り替わる。確認ダイアログ等のUIは追加実装しない。

`src/main.tsx`でvite-plugin-pwaが生成する仮想モジュール
`virtual:pwa-register`の`registerSW()`を呼び出すのみとする。

既存のほとんどの操作は自動保存済み（T29他）であるため、予期しないリロードに
よるデータ消失リスクは低いと判断する。

---

# 8. 対象外（本フェーズでは扱わない）

- maskable icon対応（Android等でのアイコン安全域最適化）
- プッシュ通知
- バックグラウンド同期
- TWA/Google Play公開（`docs/08`・`docs/10`同様、引き続き別フェーズ）
- 公開版（`build:public`）のFirebase Hosting自動デプロイ（現状`.github/workflows/firebase-deploy.yml`は
  自チーム版ビルドのみが対象。公開版の配布方法自体が別の検討事項であり、本ドキュメントの
  スコープ外とする）

---

# 9. 影響ファイル・タスク分割方針

`docs/50_タスク作成ルール.md`の粒度に従い、以下の3タスク（T91〜T93）に分割した。

| タスク | 内容 | 変更対象ファイル |
|---|---|---|
| T91 | PWAアイコン生成基盤 | `scripts/generate-pwa-icons.ts`（新規）、`public/pwa-icon-source.svg`（新規）、`public/pwa-192x192.png`・`public/pwa-512x512.png`（新規生成物）、`package.json`（`sharp`追加） |
| T92 | vite-plugin-pwa導入・manifest設定・mode別Service Worker戦略 | `vite.config.ts`、`package.json`（`vite-plugin-pwa`追加）、`.gitignore`（`dev-dist/`追加） |
| T93 | Service Worker登録・自動更新配線 | `src/main.tsx` |

T91→T92→T93の順に依存する（T92のmanifest.iconsがT91の生成物を参照するため）。

---

# 10. 次にやること

1. 本ドキュメントの内容を人間がレビュー・承認する
2. `tasks/`へT91〜T93のタスクファイルを作成する
3. `tasks/000_backlog.md`に新グループを追加する
4. T91→T92→T93の順に実装する
5. `npm run build`・`npm run build:public`の両方で、生成される`dist/`に
   `manifest.webmanifest`・Service Worker（`sw.js`）・アイコンが含まれることを確認する
6. 公開版ビルドで、アプリシェルがオフラインでも起動することを手動確認する
