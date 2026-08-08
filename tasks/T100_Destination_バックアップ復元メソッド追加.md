# Task T100 Destination バックアップ復元メソッド追加

---

## 1. 対象設計書

ref:
- docs/12_データバックアップ機能設計.md#6 CarpoolRepositoryインターフェースの拡張
- docs/05_データ設計.md#7 Destination

---

## 2. このタスクのゴール

バックアップの読み込みで、元のIDのまま目的地データを書き込めるようにする
`restoreDestination`メソッドを`CarpoolRepository`に追加し、Firestore・Dexie両方に
実装する。T99（PickupLocation）と同じパターンで実装する。既存の`createDestination`
には一切手を触れない。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/CarpoolRepository.ts`（`restoreDestination`の型追加）
- `src/repositories/firestore/destinationRepository.ts`（実装追加）
- `src/repositories/dexie/destinationRepository.ts`（実装追加）

---

## 4. 実装範囲（やること）

- `CarpoolRepository`インターフェースに
  `restoreDestination(destination: Destination): Promise<void>;`を追加する
- `firestore/destinationRepository.ts`：`Pick<...>`に`'restoreDestination'`を追加し、
  `setDoc(doc(db, firestorePaths.destinationDocument(destination.id)), { name, latitude,
  longitude })`で実装する
- `dexie/destinationRepository.ts`：`Pick<...>`に`'restoreDestination'`を追加し、
  `db.destinations.put({ ...destination })`で実装する

---

## 5. 実装範囲外（やらないこと）

- 他エンティティの`restore*`実装
- `clearAllData`・`backupService`（T102、T103）
- 既存`createDestination`等、他メソッドの変更

---

## 6. 受け入れ条件

- `CarpoolRepository`に`restoreDestination`が追加されている
- Firestore・Dexie両方に実装され、`repository.restoreDestination`として呼び出せる
- `npm run build`が成功する
- `restoreDestination`実行後、`getDestination(destination.id)`で渡した内容と
  同じ`Destination`が取得できる

---

## 7. 依存タスク

- T99 PickupLocation バックアップ復元メソッド追加（`CarpoolRepository.ts`への追記を直列で進める）

---

## 提案（タスク対象外）

なし
