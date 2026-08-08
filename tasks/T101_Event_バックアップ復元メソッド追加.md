# Task T101 Event バックアップ復元メソッド追加

---

## 1. 対象設計書

ref:
- docs/12_データバックアップ機能設計.md#6 CarpoolRepositoryインターフェースの拡張
- docs/05_データ設計.md#8 Event

---

## 2. このタスクのゴール

バックアップの読み込みで、元のIDのままイベント本体を書き込めるようにする
`restoreEvent`メソッドを`CarpoolRepository`に追加し、Firestore・Dexie両方に実装する。
T95と同じパターンで実装する。既存の`createEvent`には一切手を触れない。

回答（Response）・配車結果（Carpool）の復元は、既存の`createResponse(eventId, familyId,
data)`・`saveCarpools(eventId, carpools)`が既にID指定の書き込みに対応しているため
新規メソッド不要（docs/12_データバックアップ機能設計.md#6）。本タスクの対象はEvent本体のみ。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/CarpoolRepository.ts`（`restoreEvent`の型追加）
- `src/repositories/firestore/eventRepository.ts`（実装追加）
- `src/repositories/dexie/eventRepository.ts`（実装追加）

---

## 4. 実装範囲（やること）

- `CarpoolRepository`インターフェースに`restoreEvent(event: Event): Promise<void>;`を追加する
- `firestore/eventRepository.ts`：`Pick<...>`に`'restoreEvent'`を追加し、
  `setDoc(doc(db, firestorePaths.eventDocument(event.id)), { name, date, destinationId,
  createdAt: Timestamp.fromDate(event.createdAt), updatedAt: Timestamp.fromDate(event.updatedAt) })`
  で実装する。`serverTimestamp()`は使わず、バックアップファイルの値をそのまま書き込む（T95参照）
- `dexie/eventRepository.ts`：`Pick<...>`に`'restoreEvent'`を追加し、
  `db.events.put({ ...event })`で実装する

---

## 5. 実装範囲外（やらないこと）

- Response・Carpoolの復元処理（既存の`createResponse`・`saveCarpools`をそのまま使う。
  `backupService`側の責務。T103参照）
- `clearAllData`（T102）
- 既存`createEvent`等、他メソッドの変更

---

## 6. 受け入れ条件

- `CarpoolRepository`に`restoreEvent`が追加されている
- Firestore・Dexie両方に実装され、`repository.restoreEvent`として呼び出せる
- `npm run build`が成功する
- `restoreEvent`実行後、`getEvent(event.id)`で渡した内容と同じ`Event`が取得できる

---

## 7. 依存タスク

- T100 Destination バックアップ復元メソッド追加（`CarpoolRepository.ts`への追記を直列で進める）

---

## 提案（タスク対象外）

なし
