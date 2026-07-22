# CarpoolBridge

![GitHub Actions](https://github.com/tetteleee/carpoolbridge/actions/workflows/firebase-deploy.yml/badge.svg)

## 開発

開発サーバー起動

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

## E2Eテスト

Firebase Emulator Suite（Auth・Firestore）とVite開発サーバーを自動起動してテストを実行します。

```bash
npm run test:e2e
```

初回実行時はPlaywrightのブラウザバイナリのダウンロードが必要です。

```bash
npx playwright install chromium
```

## Seed（テストデータ投入）

開発中のFirestoreデータを、アプリの主要機能を一通り確認できる程度のテストデータ
（家族・子ども・集合場所・目的地・イベント）で初期化するための開発用スクリプトです。

```bash
npm run seed
```

- ドキュメントIDはすべて固定値です。既存データの削除は行わず`set()`で書き込むため、
  何度実行しても同じ内容になります（冪等）。
- 投入先は常に`.firebaserc`の`projects.default`（実Firebaseプロジェクト）です。
- Firebase Admin SDKで実行するため、Firestore Security Rules（`isStaff()`）を経由しません。
  実行にはサービスアカウントキーが必要です（初回のみ）。

  1. Firebase Console → プロジェクトの設定 → サービスアカウント → 「新しい秘密鍵の生成」
  2. ダウンロードしたJSONファイルをローカルの適当な場所に保存する（**リポジトリには含めない**）
  3. 実行時に環境変数で指定する
     ```bash
     GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json npm run seed
     ```

  GitHub Actionsのデプロイ（`firebase-deploy.yml`）で使っている`FIREBASE_SERVICE_ACCOUNT`と
  同じ種類の鍵です。`gcloud`のインストールやログインは不要です。
- テストデータの定義は[src/services/dev/seedData.ts](src/services/dev/seedData.ts)にまとまっています。
  マスタ管理画面の開発用機能「サンプルデータ投入」ボタンとも共通のデータ定義です。
  Firestoreのデータ構造を変更した場合は、このファイルを更新してください。

**注意：開発環境向けの機能です。現時点ではDev/Prod用のFirebaseプロジェクトが分離されて
いないため、実行すると実際のFirebaseプロジェクトに書き込まれます。**
（既存データの削除は行わないため、固定IDのドキュメントを追加・上書きするだけです）

## デプロイ

```bash
firebase deploy
```

または Hostingのみ

```bash
firebase deploy --only hosting
```

## Firestore Security Rules変更時

Rulesを変更した場合はデプロイが必要です。

```bash
firebase deploy --only firestore:rules
```

## 初回セットアップ

Firebaseへログイン

```bash
firebase login
```

プロジェクト確認

```bash
firebase use
```

必要に応じてプロジェクト切り替え

```bash
firebase use <project-id>
```
