# CarpoolBridge

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
