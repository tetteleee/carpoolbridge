# Task T01 Firestore Security Rules実装

---

## 1. 対象設計書

ref: docs/06_認証・権限管理設計.md#6 Firestore Security Rules

---

## 2. このタスクのゴール

`staffUsers` コレクションに登録されたUIDのみが各コレクションへ読み書きできるよう、
Firestore Security Rulesを実装する。

---

## 3. 変更対象ファイル

- `firestore.rules`

---

## 4. 実装範囲（やること）

06_認証・権限管理設計.md 6章に記載された内容をそのまま `firestore.rules` として実装する。

- `isStaff()` 関数
  - `request.auth != null` かつ `staffUsers/{request.auth.uid}` ドキュメントが存在する場合に `true` を返す
- 以下のコレクションは `isStaff()` が `true` の場合のみ `read, write` を許可する
  - `families`
  - `children`
  - `coaches`
  - `pickupLocations`
  - `destinations`
  - `events`
- `staffUsers/{uid}`
  - `read` は本人（`request.auth.uid == uid`）のみ許可
  - `write` は常に `false`
- 上記いずれにも該当しない全パス（`{document=**}`）は `read, write` を `false` とする

---

## 5. 実装範囲外（やらないこと・触らないこと）

- `pendingUsers`、承認画面、ロール管理など06章8節で非採用とされた仕組みの追加
- `events` 配下の `responses` / `carpools` サブコレクションなど、06#6に明記されていないルールの追加・変更
  （05データ設計書側にサブコレクションの定義があっても、本タスクのスコープは06#6の記載範囲に限定する）
- Firebase CLIでの実際のデプロイ作業・動作確認そのもの（ルールファイルの実装のみが対象）
- 匿名認証・staffUsers確認ロジックなどアプリケーション側の実装（T05, T06で対応）
- `firebase.json` / `firestore.indexes.json` の変更

---

## 6. 受け入れ条件

- `firestore.rules` の内容が06_認証・権限管理設計.md 6章の記載と一致している
- `families` / `children` / `coaches` / `pickupLocations` / `destinations` / `events` の各コレクションについて、
  - `staffUsers` 未登録UIDでは読み書きできない
  - `staffUsers` 登録済みUIDでは読み書きできる
  ことをFirestore Emulator等で確認できる
- `staffUsers/{uid}` は本人のみ `read` でき、`write` は常に拒否されることを確認できる
- 上記以外のパスへの読み書きが拒否されることを確認できる

---

## 7. 依存タスク

なし（バックログ記載通り）

---

## 備考（矛盾点の指摘のみ・設計変更提案ではない）

リポジトリ直下に既存の `firestore.rules` が既に存在しており、06#6の記載内容と以下の差分がある。

- `pendingUsers` コレクションへの `match` が既存ファイルには存在するが、06#6には記載がない
- `events` 配下に `responses` / `carpools` サブコレクションの `match` が既存ファイルには存在するが、06#6には記載がない
- `staffUsers/{uid}` の許可ルールが、既存ファイルでは `allow get` / `allow list, write: if false` と分離されているが、
  06#6では `allow read` / `allow write: if false` という表現になっている

本タスクは06#6を正として実装するため、既存ファイルとの差分をそのまま踏襲すべきかどうかは判断せず、
人間側の確認・設計書更新の要否判断を仰ぐこと。
