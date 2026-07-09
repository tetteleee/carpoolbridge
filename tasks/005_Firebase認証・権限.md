# Task005 Firebase認証・権限

Version: 1.0

---

# 目的

06_認証・権限管理設計.mdに定義されたFirebase Authentication
（Anonymous Authentication）＋staffUsersホワイトリスト方式を実装する。

本Taskでは「未登録UIDはアプリを利用できない」状態を確立することを
ゴールとし、Task002〜004で作成済みの各画面（モックデータ・モック
ストア使用）自体の実装は変更しない。

---

# 背景

現在（Task001〜004完了時点）は、認証なしで誰でも全画面へ
アクセスできる状態になっている。

- Task002：イベント一覧（モック）
- Task003：イベント作成（インメモリストア）
- Task004：イベント編集・回答入力（インメモリストア）

本Taskで匿名認証とstaffUsersチェックを導入し、
登録済み利用者のみがアプリへアクセスできるようにする。

Firestoreへの実データ接続（families・children・events・responses等の
モックストアの置き換え）は本Taskのスコープ外とし、別Taskで対応する
（10章参照）。

---

# 完了条件

- Firebaseプロジェクトへ接続できる（firebaseConfigを環境変数化）
- アプリ起動時に匿名認証（Anonymous Authentication）が自動実行される
- 取得したUIDでstaffUsersコレクションを確認する
- 未登録UIDの場合、利用申請画面（UID表示＋コピーボタン）が表示され、
  他画面へはアクセスできない
- 登録済みUIDの場合、通常通りアプリ（ホーム画面以降）が利用できる
- Firestore Security Rules（06_認証・権限管理設計.md 6章）をデプロイし、
  staffUsers未登録では families 等へアクセスできないことを確認する
- npm run build が成功する

---

# 実装内容

## 1. Firebase導入

`firebase` パッケージを導入する。

`src/firebase/config.ts` を新規作成し、Firebaseアプリを初期化する。

```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

APIキー等は `.env` に定義し、`.gitignore` へ追加する
（`.env.example` に空のキー一覧のみコミットする）。

---

## 2. 匿名認証フック

`src/auth/useAnonymousAuth.ts` を新規作成する。

役割

- アプリ起動時に `onAuthStateChanged` を監視する
- 未サインインの場合は `signInAnonymously` を実行する
- UID・認証状態（loading中かどうか）を返す

```typescript
export type AuthState =
  | { status: "loading" }
  | { status: "signedIn"; uid: string };
```

anyは使用しない。

---

## 3. staffUsers確認フック

`src/auth/useStaffStatus.ts` を新規作成する。

役割

- UIDを受け取り、`staffUsers/{uid}` ドキュメントの存在を確認する
- 結果を以下の状態で返す

```typescript
export type StaffStatus =
  | { status: "checking" }
  | { status: "registered" }
  | { status: "unregistered" };
```

04_データ設計.md 11章・06_認証・権限管理設計.md 5章に準拠し、
`staffUsers` コレクションのドキュメントID＝UIDとする。

---

## 4. 利用申請画面

`src/pages/RequestAccessPage.tsx` を新規作成する。

06_認証・権限管理設計.md 4章のワイヤーフレームに準拠する。

```
配車アシスタント

利用申請

UID

bL3f2QmP4x......

[コピー]
```

- 説明文は表示しない（設計方針通り）
- コピーボタンでUIDをクリップボードへコピーする
- LINE送信等の案内文言は表示しない（運用者が別途口頭・LINEで伝える前提）

---

## 5. アクセスゲートの実装

`src/auth/AuthGate.tsx` を新規作成し、`AppRouter` の最上位で
既存のルーティング全体をラップする。

分岐

```
認証状態がloading
  → ローディング表示

signedIn かつ staffStatus = checking
  → ローディング表示

signedIn かつ staffStatus = unregistered
  → RequestAccessPage を表示（他ルートへは遷移させない）

signedIn かつ staffStatus = registered
  → 既存のAppRouter（Task001〜004のルート）をそのまま表示
```

Task001で作成済みのルート構成（`/`・`/events/new`・
`/events/:id/edit` 等）自体は変更しない。`AuthGate` は
その外側に被せるラッパーとしてのみ実装する。

---

## 6. Firestore Security Rulesのデプロイ

06_認証・権限管理設計.md 6章のRulesをそのまま
`firestore.rules` として配置し、Firebase CLIでデプロイする。

Rules自体の内容は変更しない（本Taskの対象は認証・権限フローの実装であり、
Rules設計自体は06_認証・権限管理設計.mdを正とする）。

---

# スコープ外

以下は実装しない。

- families・children・events・responses等のモックストアをFirestoreへ
  置き換える実装（別Taskで対応）
- pendingUsers・承認画面・ロール管理（06_認証・権限管理設計.md 2章の
  将来拡張、MVP対象外）
- メール認証・パスワード認証・招待コード
- staffUsersへの登録UI（Firebase Consoleから手動登録する運用のため
  不要、06_認証・権限管理設計.md 3章参照）
- 保護者向け認証（Phase2対応）

---

# 確認項目

```
□ npm install が成功する

□ npm run build が成功する

□ 未登録UIDでアクセスすると利用申請画面が表示され、
  他画面へ遷移できない

□ 利用申請画面のUIDをFirebase Consoleのstaffusersへ
  手動登録すると、リロード後にアプリが利用できる

□ 登録済みUIDでは通常通りホーム画面以降が利用できる

□ コピーボタンでUIDがクリップボードにコピーされる

□ Firestore Security Rulesが期待通り動作する
  （未登録UIDからfamilies等へ直接アクセスできない）

□ .envに秘匿情報を置き、リポジトリにコミットされていない
```

---

# 参照ドキュメント

06_認証・権限管理設計.md
・3章 利用フロー
・4章 利用申請画面
・5章 Firestore構成（staffUsers）
・6章 Firestore Security Rules

04_データ設計.md
・11章 Firestore構成
・14章 将来追加予定（Authentication注記）

02_要件定義.md
・12章 認証

00_開発方針.md
・5章 開発フロー（重要Task：認証・権限）
・8章 動作確認（認証・権限Taskの追加確認項目）

---

# 実装ルール

- TypeScriptで実装する
- anyは使用しない
- 関数コンポーネント・Hooksで実装する
- React Hooksのルールを守る
- MVPなので過剰な抽象化はしない
- Firebase関連のコードは本Taskで初めて追加する
  （Task001〜004のスコープ外ルールと整合させる）

---

# 実装ツールへの指示

以下を厳守すること。

- Taskに書かれた内容のみ実装する
- モックストア（eventStore・families等）をFirestore接続へ
  置き換える実装は行わない
- staffUsersの登録UI・承認フローを独自に追加しない
- Task001〜004で作成済みのルーティング・コンポーネントを壊さない
- Firestore Security Rulesの内容を独自に変更・追加しない
  （06_認証・権限管理設計.mdを唯一の正とする）
- 分からない仕様は推測せず質問する
