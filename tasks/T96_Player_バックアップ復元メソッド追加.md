# Task T96 Player バックアップ復元メソッド追加

---

## 1. 対象設計書

ref:
- docs/12_データバックアップ機能設計.md#6 CarpoolRepositoryインターフェースの拡張
- docs/05_データ設計.md#4 Player

---

## 2. このタスクのゴール

バックアップの読み込みで、元のIDのまま選手データを書き込めるようにする`restorePlayer`
メソッドを`CarpoolRepository`に追加し、Firestore・Dexie両方に実装する。T95（Family）と
同じパターンで実装する。既存の`createPlayer`には一切手を触れない。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/CarpoolRepository.ts`（`restorePlayer`の型追加）
- `src/repositories/firestore/playerRepository.ts`（実装追加）
- `src/repositories/dexie/playerRepository.ts`（実装追加）

---

## 4. 実装範囲（やること）

- `CarpoolRepository`インターフェースに`restorePlayer(player: Player): Promise<void>;`を追加する
- `firestore/playerRepository.ts`：`Pick<...>`に`'restorePlayer'`を追加し、
  `setDoc(doc(db, firestorePaths.playerDocument(player.id)), { familyId, name,
  schoolEntryYear, isActive, createdAt: Timestamp.fromDate(player.createdAt),
  updatedAt: Timestamp.fromDate(player.updatedAt) })`で実装する。`serverTimestamp()`は
  使わず、バックアップファイルの値をそのまま書き込む（T95参照）
- `dexie/playerRepository.ts`：`Pick<...>`に`'restorePlayer'`を追加し、
  `db.players.put({ ...player })`で実装する

---

## 5. 実装範囲外（やらないこと）

- 他エンティティの`restore*`実装
- `clearAllData`・`backupService`（T102、T103）
- 既存`createPlayer`等、他メソッドの変更

---

## 6. 受け入れ条件

- `CarpoolRepository`に`restorePlayer`が追加されている
- Firestore・Dexie両方に実装され、`repository.restorePlayer`として呼び出せる
- `npm run build`が成功する
- `restorePlayer`実行後、`getPlayersByFamilyId(player.familyId)`に渡した内容と
  同じ`Player`が含まれる

---

## 7. 依存タスク

- T95 Family バックアップ復元メソッド追加（`CarpoolRepository.ts`への追記が競合しないよう直列で進める）

---

## 提案（タスク対象外）

なし
