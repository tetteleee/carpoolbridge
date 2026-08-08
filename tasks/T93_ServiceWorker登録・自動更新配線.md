# 対象設計書

ref: docs/11_PWA化設計.md#7

# ゴール

`vite-plugin-pwa`が生成する仮想モジュール経由でService Workerを登録し、
新バージョン検知時に自動更新（`autoUpdate`）が実際に機能する状態にする。

# 変更対象ファイル

- `src/main.tsx`

# 実装範囲（やること）

- `virtual:pwa-register`から`registerSW`をimportし、`main.tsx`の
  アプリ起動処理に追加する（`immediate: true`でロード直後に登録する）
- 確認ダイアログ等の追加UIは実装しない（`docs/11_PWA化設計.md#7`の決定事項どおり、
  自動更新のみとする）

# 実装範囲外（やらないこと・触らないこと）

- 更新通知バナー・トースト等のUIコンポーネントは作らない
- オフライン時の独自エラーハンドリング（`onOfflineReady`等のコールバック）は
  最小限（ログ出力程度、または未使用）にとどめ、UIには影響させない
- `vite.config.ts`のPWAプラグイン設定自体（T92の範囲）は変更しない

# 受け入れ条件（完了判定基準）

- `npm run build`・`npm run build:public`がともに成功する
- `npm run preview`（またはビルド成果物を静的サーバーで配信）した状態で、
  ブラウザの開発者ツールからService Workerが登録されていることを確認できる
- `npx eslint .`がエラーなく通る
- 既存のE2Eテスト（`npm run test:e2e`・`npm run test:e2e:public`）が
  Service Worker登録によって壊れていないことを確認する

# 依存タスク

- T92（`virtual:pwa-register`はT92でVitePWAプラグインを導入しないと存在しない仮想モジュールのため）
