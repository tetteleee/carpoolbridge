# 対象設計書

ref: docs/12_公開版配布・ホスティング設計.md#4.2, #5

# ゴール

Firebase CLIから公開版プロジェクト（`carpoolbridge-go`）を扱えるよう、
`.firebaserc`にproject aliasを追加する。

# 変更対象ファイル

- `.firebaserc`

# 実装範囲（やること）

- `.firebaserc`の`projects`に`"public": "carpoolbridge-go"`を追加する
  （`"default": "carpoolbridge"`は変更しない）

# 実装範囲外（やらないこと・触らないこと）

- `firebase.json`は変更しない（`hosting`設定は自チーム版・公開版で共通のまま流用する。
  docs/12#4.2参照）
- `carpoolbridge-go`プロジェクト自体の作成・サービスアカウントキー発行・
  GitHub Secrets登録は人間の作業のため対象外（docs/12#5参照）

# 受け入れ条件（完了判定基準）

- `.firebaserc`が正しいJSONとしてパースできる
- `firebase deploy --only hosting -P public --dry-run`相当の確認
  （ローカルにFirebase CLIの認証がある場合のみ。CIでの実際の確認はT95の受け入れ条件で行う）

# 依存タスク

- なし
