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
