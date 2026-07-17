# Task T10 Destination_CRUD処理

---

## 1. 対象設計書

ref:
- docs/05_データ設計.md#6 Destination（目的地）
- docs/03_ユースケース.md#UC-09 目的地を登録・編集・削除する

---

## 2. ゴール

目的地（Destination）マスタデータに対する登録・取得・更新・削除処理を実装し、以降のUI（T14）から呼び出せる状態にする。

---

## 3. 変更対象ファイル（想定）

- src/services/master/destinationService.ts

※ファイル構成はプロジェクト構成に合わせて読み替えてよい。

---

## 4. 実装範囲

- `destinations` コレクションへの新規登録処理
- `destinations` コレクションからの一覧取得処理
- `destinations` コレクションからの単一取得処理
- 既存ドキュメント（name・address・latitude・longitude）の更新処理
- 既存ドキュメントの削除処理
  - DestinationにはisActiveフィールドは存在しないため、論理削除ではなく物理削除とする
- Firestoreコレクションパス定数（T04）を利用して参照する

---

## 5. 実装範囲外

- UI実装（一覧表示・入力フォーム等。T14で実施）
- Firestore Security Rules変更
- サンプルデータ投入機能（T17）
- Family・Child・Event等、他データとの関連処理

---

## 6. 受け入れ条件

- `destinations` コレクションへ新規ドキュメントを登録できる
- 登録済みの目的地一覧を取得できる
- 既存ドキュメントのname・address・latitude・longitudeを更新できる
- 既存ドキュメントを削除できる
- コレクションパスをハードコードしていない
- UIに依存しないサービス層として利用できる

---

## 7. 依存タスク

- T04 Firestoreコレクションパス定数定義

---

## 提案（タスク対象外）

なし
