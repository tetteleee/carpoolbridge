# 対象設計書

ref: docs/13_TWA・Google Play公開設計.md#5

# ゴール

将来配置する`.well-known/assetlinks.json`（Google Play TWA公開時のDigital Asset Links
検証用ファイル）がFirebase Hostingから配信されるよう、`firebase.json`の
`hosting.ignore`設定を修正する。

# 変更対象ファイル

- `firebase.json`

# 実装範囲（やること）

- `hosting.ignore`に否定パターン`"!.well-known/**"`を、`"**/.*"`の直後に追加し、
  `.well-known`配下だけをドットファイル除外の対象外にする

```json
"ignore": [
  "firebase.json",
  "**/.*",
  "!.well-known/**",
  "**/node_modules/**"
]
```

# 実装範囲外（やらないこと・触らないこと）

- `.well-known/assetlinks.json`本体の作成・配置は行わない（`package_name`・
  `sha256_cert_fingerprints`が未確定のため。docs/13#5.3参照）
- `hosting`のその他設定（`public`・`rewrites`）は変更しない
- `.firebaserc`は変更しない

# 受け入れ条件（完了判定基準）

- `firebase.json`が正しいJSONとしてパースできる
- 動作確認: `public/.well-known/test.txt`のような一時的な検証用ファイルを作成し
  `npm run build`（または`build:public`）→`dist/.well-known/`配下にコピーされることを
  確認する。確認後、検証用ファイルはコミット対象から外す（リポジトリに残さない）
- `npm run build`・`npm run build:public`・`npx eslint .`が通る

# 依存タスク

- なし
