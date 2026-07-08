# 配車アシスタント Milestone1 セットアップ手順

このプロジェクトは Vite + React + TypeScript + Firebase の雛形です。
04_プロトタイプ・06_認証・権限管理設計の方針（匿名認証 + staffUsersホワイトリスト）を
最小構成で組み込んであります。

---

## 1. Firebaseプロジェクトを作成する

1. https://console.firebase.google.com/ を開き、「プロジェクトを追加」
2. プロジェクト名を入力（例:carpool-assistant）
3. Googleアナリティクスは不要なのでオフでよい

---

## 2. Authenticationを有効化する

1. 左メニュー「Authentication」→「始める」
2. 「Sign-in method」タブ→「匿名」を有効化

---

## 3. Firestoreを有効化する

1. 左メニュー「Firestore Database」→「データベースの作成」
2. 本番環境モードで開始してよい（ルールは後で `firestore.rules` をデプロイして上書きする）
3. リージョンは `asia-northeast1`（東京）を推奨

---

## 4. Webアプリを追加し、設定値を取得する

1. プロジェクトの概要画面→「</>」（Webアプリを追加）
2. アプリのニックネームを入力（例:carpool-assistant-web）
3. Firebase Hostingは今チェックしなくてよい（後述のCLIで設定する）
4. 表示された `firebaseConfig` の値を控える

---

## 5. ローカル環境をセットアップする

```bash
npm install
cp .env.example .env
```

`.env` を開き、手順4で取得した値を埋める。

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

※ FirebaseのapiKeyはクライアントに埋め込まれる前提の値であり、
　 それ自体は秘密情報ではありません（アクセス制御はFirestore Rules側で行います）。
　 .envに分けているのは環境ごとの設定管理を楽にするためです。

---

## 6. ローカルで起動確認する

```bash
npm run dev
```

表示されたURL（例: http://localhost:5173）をスマホの同一Wi-Fi経由、
または `--host` オプション付きで起動してスマホの実機からアクセスして確認する。

```bash
npm run dev -- --host
```

起動直後は「匿名認証には成功しましたが、まだ利用申請が承認されていません」
という画面と、あなたのUIDが表示されるはずです。これが正常な状態です。

---

## 7. 自分のUIDをstaffUsersへ登録する（初回のみ・手動）

1. 表示されたUIDをコピー
2. Firebase Console →「Firestore Database」→「データを開始」または「+コレクションを開始」
3. コレクションID: `staffUsers`
4. ドキュメントID: コピーしたUID
5. フィールドは空のままで保存してよい（存在確認だけに使うため）

保存後、アプリをリロードすると
「✓ Firebase Hosting / Authentication / Firestore の疎通に成功しました。」
と表示されれば、Milestone1は完了です。

他の配車担当・管理者も同様に、初回アクセス時に表示されるUIDを
あなたに伝えてもらい、同じ手順で `staffUsers` へ追加してください。

---

## 8. Firebase CLIをセットアップし、Firestore Rulesをデプロイする

このサンドボックス環境ではFirebaseへのログイン・デプロイができないため、
以下はご自身のPCで実行してください。

```bash
npm install -g firebase-tools
firebase login
```

`.firebaserc` の `your-firebase-project-id` を、実際のプロジェクトID
（Firebase Consoleのプロジェクト設定に表示されているID）に書き換える。

```bash
firebase deploy --only firestore:rules
```

これで `firestore.rules`（staffUsersチェック付きのルール）が反映されます。
反映前は「本番環境モード」のデフォルトルール（全拒否）のままなので、
反映するまでアプリからの読み書きは失敗する点に注意してください。

---

## 9. Firebase Hostingへデプロイする（公開URLで確認したい場合）

```bash
npm run build
firebase deploy --only hosting
```

デプロイ後に表示される `https://<プロジェクトID>.web.app` にスマホからアクセスして、
同様にUIDが表示されること・staffUsers登録後に疎通確認が成功することを確認する。

---

## 10. このあとの進め方（Milestone2以降）

- Milestone2:イベント一覧・イベント編集画面の実装（04_プロトタイプの5章・7章に対応）
- Milestone3:配車画面・ドラッグ&ドロップ・自動保存（04_プロトタイプの8章に対応）
- Milestone4:07_配車アルゴリズムの実装・LINEコピー機能

並行して、04_プロトタイプを配車担当3人に見せてフィードバックを集める。
Milestone3に着手する前にフィードバックを反映できるとベスト。
