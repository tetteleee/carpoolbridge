# Task T95 Family バックアップ復元メソッド追加

---

## 1. 対象設計書

ref:
- docs/12_データバックアップ機能設計.md#6 CarpoolRepositoryインターフェースの拡張
- docs/05_データ設計.md#3 Family

---

## 2. このタスクのゴール

バックアップの読み込み（インポート）で、元のIDのまま家庭データを書き込めるようにする
`restoreFamily`メソッドを`CarpoolRepository`に追加し、Firestore・Dexie両方に実装する。
既存の`createFamily`（新規登録画面用、ID自動採番）には一切手を触れない。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/CarpoolRepository.ts`（`restoreFamily`の型追加）
- `src/repositories/firestore/familyRepository.ts`（実装追加）
- `src/repositories/dexie/familyRepository.ts`（実装追加）

---

## 4. 実装範囲（やること）

- `CarpoolRepository`インターフェースに`restoreFamily(family: Family): Promise<void>;`を追加する
- `firestore/familyRepository.ts`：`familyRepository`の`Pick<...>`に`'restoreFamily'`を追加し、
  `setDoc(doc(db, firestorePaths.familyDocument(family.id)), { familyName, vehicleCapacity,
  pickupLocationId, isActive, createdAt: Timestamp.fromDate(family.createdAt),
  updatedAt: Timestamp.fromDate(family.updatedAt) })`で実装する。
  **`createFamily`と異なり`serverTimestamp()`は使わず、バックアップファイルに入っていた
  `createdAt`/`updatedAt`をそのまま書き込む**（復元処理のため、書き出し時点の値を保持する）
- `dexie/familyRepository.ts`：同じく`Pick<...>`に`'restoreFamily'`を追加し、
  `db.families.put({ ...family })`で実装する（`put`はキーが既存でも上書きするupsert）

---

## 5. 実装範囲外（やらないこと）

- 他エンティティの`restore*`実装（T96以降）
- `clearAllData`の実装（T102）
- `backupService`（バックアップ全体のオーケストレーション、T103）
- 既存`createFamily`・`updateFamily`等、他メソッドの変更

---

## 6. 受け入れ条件

- `CarpoolRepository`に`restoreFamily`が追加されている
- `firestore/familyRepository.ts`・`dexie/familyRepository.ts`の両方に`restoreFamily`が実装され、
  それぞれの`index.ts`経由で`repository.restoreFamily`として呼び出せる
- `npm run build`が成功する（インターフェース追加後も両バックエンドの`repository`オブジェクトが
  型エラーを起こさない）
- `restoreFamily`実行後、`getFamily(family.id)`で渡した内容と同じ`Family`が取得できる
  （`createdAt`/`updatedAt`を含む）

---

## 7. 依存タスク

- T88 呼び出し元をrepositoryエイリアス経由に切り替え

---

## 提案（タスク対象外）

なし
