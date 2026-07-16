# tasks/task_T05_匿名認証初期化・UID取得処理.md

# Task T05 匿名認証初期化・UID取得処理

---

## 1. 対象設計書

ref: docs/06_認証・権限管理設計.md#2 設計方針

ref: docs/06_認証・権限管理設計.md#3 利用フロー

---

## 2. ゴール

Firebase Authentication の匿名認証を利用して、アプリ起動時にUIDを取得できる状態にする。

認証済みユーザーのUIDを後続処理で利用できるようにする。

---

## 3. 変更対象ファイル（想定）

- src/firebase/auth.ts
- src/main.ts（または認証初期化処理）
- src/lib/firebase.ts（必要な場合のみ）

---

## 4. 実装範囲

### Firebase Authentication 初期化

- Firebase Authenticationを利用できるよう設定する
- Anonymous Authenticationを利用する

### 起動時認証

- アプリ起動時に匿名認証を実施する
- 未認証の場合は匿名サインインを行う
- 認証済みの場合は既存ユーザーを利用する

### UID取得

- 認証ユーザーのUIDを取得できるようにする
- 後続処理からUIDを利用できる構成とする

---

## 5. 実装範囲外

以下は本タスクでは実装しない。

- staffUsersコレクション照会
- ホワイトリスト判定
- 利用申請画面
- UIDコピー機能
- 画面遷移制御
- Firestoreデータアクセス

これらは以下タスクで実装する。

- T06
- T07
- T08

---

## 6. 受け入れ条件

- Firebase Anonymous Authenticationで認証できる
- 初回アクセス時にUIDが取得できる
- 再アクセス時も同一UIDを取得できる（匿名認証セッションが維持される範囲）
- 認証処理で例外が発生しない
- 後続処理からUIDを参照できる

---

## 7. 依存タスク

なし

---

## 提案

なし
