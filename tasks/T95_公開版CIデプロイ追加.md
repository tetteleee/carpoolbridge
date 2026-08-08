# 対象設計書

ref: docs/12_公開版配布・ホスティング設計.md#4, #4.3

# ゴール

`main`マージ時に、自チーム版と同様に公開版（`build:public`）も自動で
`carpoolbridge-go`へデプロイされる状態にする。

# 変更対象ファイル

- `.github/workflows/firebase-deploy.yml`

# 実装範囲（やること）

- 既存の自チーム版向けステップ（Deploy Firestore Rules・Build・Deploy Firebase Hosting）の後に、
  公開版向けの以下2ステップを追加する（docs/12#4.3のイメージ通り）
  - `npm run build:public`でビルド
  - `FirebaseExtended/action-hosting-deploy@v0`で`carpoolbridge-go`へデプロイ
    （`firebaseServiceAccount`は新規secret`FIREBASE_SERVICE_ACCOUNT_PUBLIC`を参照する）
- 公開版のビルド・デプロイは自チーム版のステップとは独立させ、
  一方の失敗がもう一方のジョブ実行に影響しないようにする
  （既存ジョブ内にステップとして追加する場合、後続ステップは前段の成否に関わらず
  実行されるよう`if: always()`等の要否を検討する）

# 実装範囲外（やらないこと・触らないこと）

- 公開版向けのFirestore Rulesデプロイステップは追加しない
  （公開版はFirestoreを使わないため。docs/08#2参照）
- 新規workflowファイルには分けない（docs/12#4で決定済み。既存の
  `firebase-deploy.yml`内にステップを追加する）
- `carpoolbridge-go`プロジェクトの作成・サービスアカウントキー発行・
  GitHub Secrets（`FIREBASE_SERVICE_ACCOUNT_PUBLIC`）登録は人間の作業のため対象外

# 受け入れ条件（完了判定基準）

- `FIREBASE_SERVICE_ACCOUNT_PUBLIC`がGitHub Secretsに登録された状態で、
  mainへのマージ後、CIが公開版のビルド・デプロイに成功する
- デプロイ後、`https://carpoolbridge-go.web.app`でアプリが起動する
- PWAとしてインストール可能で、オフラインでも起動できる
  （`docs/11_PWA化設計.md`のフルオフライン対応が新URLでも成立していることの確認）
- 自チーム版（`carpoolbridge.web.app`等）のデプロイ・動作に影響がないこと

# 依存タスク

- T94（`.firebaserc`のproject aliasが前提）
- 人間側の`FIREBASE_SERVICE_ACCOUNT_PUBLIC`登録（実装は先行できるが、
  実際のデプロイ成功確認にはこの登録が必須）
