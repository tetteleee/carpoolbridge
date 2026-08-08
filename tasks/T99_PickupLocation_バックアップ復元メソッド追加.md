# Task T99 PickupLocation バックアップ復元メソッド追加

---

## 1. 対象設計書

ref:
- docs/12_データバックアップ機能設計.md#6 CarpoolRepositoryインターフェースの拡張
- docs/05_データ設計.md#6 PickupLocation

---

## 2. このタスクのゴール

バックアップの読み込みで、元のIDのまま集合場所データを書き込めるようにする
`restorePickupLocation`メソッドを`CarpoolRepository`に追加し、Firestore・Dexie両方に
実装する。既存の`createPickupLocation`には一切手を触れない。

`PickupLocation`は`createdAt`/`updatedAt`を持たないため、T95〜T98よりシンプルな実装になる。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/CarpoolRepository.ts`（`restorePickupLocation`の型追加）
- `src/repositories/firestore/pickupLocationRepository.ts`（実装追加）
- `src/repositories/dexie/pickupLocationRepository.ts`（実装追加）

---

## 4. 実装範囲（やること）

- `CarpoolRepository`インターフェースに
  `restorePickupLocation(location: PickupLocation): Promise<void>;`を追加する
- `firestore/pickupLocationRepository.ts`：`Pick<...>`に`'restorePickupLocation'`を追加し、
  `setDoc(doc(db, firestorePaths.pickupLocationDocument(location.id)), { name, latitude,
  longitude })`で実装する（`id`はドキュメントパスに使うためデータ本体には含めない）
- `dexie/pickupLocationRepository.ts`：`Pick<...>`に`'restorePickupLocation'`を追加し、
  `db.pickupLocations.put({ ...location })`で実装する

---

## 5. 実装範囲外（やらないこと）

- 他エンティティの`restore*`実装
- `clearAllData`・`backupService`（T102、T103）
- 既存`createPickupLocation`等、他メソッドの変更

---

## 6. 受け入れ条件

- `CarpoolRepository`に`restorePickupLocation`が追加されている
- Firestore・Dexie両方に実装され、`repository.restorePickupLocation`として呼び出せる
- `npm run build`が成功する
- `restorePickupLocation`実行後、`getPickupLocation(location.id)`で渡した内容と
  同じ`PickupLocation`が取得できる

---

## 7. 依存タスク

- T98 FamilyMember バックアップ復元メソッド追加（`CarpoolRepository.ts`への追記を直列で進める）

---

## 提案（タスク対象外）

なし
