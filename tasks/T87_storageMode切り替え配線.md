# Task T87 storageMode切り替え配線（vite.config.ts alias・ビルドスクリプト）

---

## 1. 対象設計書

ref:
- docs/10_DexieRepository実装設計.md#2 storageMode切り替え機構

---

## 2. このタスクのゴール

`vite.config.ts`に`resolve.alias`を追加し、ビルドmode（`--mode local`かどうか）に応じて
`@repository`の解決先を`repositories/firestore/index.ts`（自チーム版）と
`repositories/dexie/index.ts`（公開版）で静的に切り替える仕組みを作る。
`package.json`に公開版ビルド用のスクリプトを追加する。

このタスクでは配線（設定）のみを行い、`services/`配下の呼び出し元の切り替えはT88で行う。

---

## 3. 変更対象ファイル（想定）

- `vite.config.ts`
- `package.json`（スクリプト追加のみ）

---

## 4. 実装範囲（やること）

- `vite.config.ts`を`defineConfig(({ mode }) => ({ ... }))`の関数形式に変更し、
  `resolve.alias`で`@repository`を以下のように切り替える。
  - `mode === 'local'` → `src/repositories/dexie/index.ts`
  - それ以外（通常の`vite build`、`vite dev`等） → `src/repositories/firestore/index.ts`
  （docs/10_DexieRepository実装設計.md#2のコード例を参照）
- `tsconfig`側で`@repository`のパスエイリアスをTypeScriptにも認識させる必要がある場合は、
  `tsconfig.app.json`（または該当する設定ファイル）の`compilerOptions.paths`にも
  同様のエイリアスを追加する（型チェック時にVite側のalias解決に依存しないようにするため。
  T88で実際に`@repository`をimportする際にビルドエラーが出た場合はここを確認する）
- `package.json`の`scripts`に`"build:local": "tsc -b && vite build --mode local"`を追加する
  （既存の`"build": "tsc -b && vite build"`は変更しない。自チーム版は引き続き
  `npm run build`のまま、`.github/workflows/firebase-deploy.yml`も無改修で動作する）

---

## 5. 実装範囲外（やらないこと）

- `services/`配下・`carpoolMember.ts`の`@repository`への切り替え（T88で実施）
- `.env`まわりの追加整備（公開版ビルドに新規環境変数は不要なため対象外）
- CI/CDワークフロー（`.github/workflows/`配下）への公開版ビルド追加（別タスク）

---

## 6. 受け入れ条件

- `npm run build`（自チーム版）が引き続き成功する
- `npm run build:local`（公開版）が成功する
- `npm run build:local`のビルド成果物（`dist/`配下）に`firebase`パッケージ由来のコードが
  含まれていない（`grep`等でバンドル済みJSファイルを確認する）
- `npm run build`（自チーム版）のビルド成果物に`dexie`パッケージ由来のコードが
  含まれていない

---

## 7. 依存タスク

- T77〜T86（DexieRepositoryの全エンティティ実装。`dexie/index.ts`が
  `CarpoolRepository`を満たす状態になっている必要はないが、`@repository`が
  型として機能することを確認するため実質的に完了していることが望ましい）

---

## 提案（タスク対象外）

なし
