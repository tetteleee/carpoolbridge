# tasks/task_T04_Firestoreコレクションパス定数定義.md

# Task T04 Firestoreコレクションパス定数定義

---

## 1. 対象設計書

ref: docs/05_データ設計.md#10 Firestore構成

---

## 2. ゴール

Firestoreで利用する全コレクションパスを定数として定義し、以降の実装で文字列の直接記述を行わない状態にする。

---

## 3. 変更対象ファイル（想定）

- `src/constants/firestorePaths.ts`
- （必要に応じて）`src/constants/index.ts`

※ 本タスクでは利用側の置き換えは実施しない。

---

## 4. 実装範囲

### Firestoreコレクション定数を定義する

設計書に記載されたFirestore構成に対応する定数を作成する。

対象コレクション

- `families`
- `children`
- `pickupLocations`
- `destinations`
- `events`

### Event配下サブコレクション定数を定義する

イベント配下で利用するサブコレクション名を定義する。

対象

- `responses`
- `carpools`

### パス生成関数を定義する

イベント配下サブコレクションへアクセスするためのパス生成関数を用意する。

例（名称はプロジェクト規約に従う）

- Eventドキュメントパス
- Responseコレクションパス
- Responseドキュメントパス
- Carpoolコレクションパス
- Carpoolドキュメントパス

※実装方式（関数・オブジェクト等）はプロジェクトのコーディング規約に従う。

---

## 5. 実装範囲外

以下は本タスクでは実施しない。

- Firestore CRUD実装
- 型定義の追加・修正
- Security Rules変更
- Repository/Service実装
- 既存コードの全面的な置き換え
- UI変更

---

## 6. 受け入れ条件

- Firestore構成に記載された全コレクション名が定数化されている
- `responses`・`carpools`のサブコレクションも定数化されている
- Event配下ドキュメントのパス生成が定数経由で行える
- Firestoreパス文字列が一箇所に集約されている
- 設計書とコレクション名が一致している

---

## 7. 依存タスク

- T02 型定義 Family・Child・PickupLocation・Destination
- T03 型定義 Event・Response・Carpool

---

## 提案（設計変更ではありません）

今後Firestoreアクセスが増えることを考えると、単なる文字列定数だけではなく、ドキュメントパス生成関数まで同ファイルにまとめておくと、

- パス記述ミスを防げる
- サブコレクションのネストを統一できる
- CRUD実装（T09以降）がシンプルになる

ため保守性が向上する。

なお、これは実装方法の提案であり、設計書の仕様変更を意図するものではない。
