# Task T102 clearAllData実装

---

## 1. 対象設計書

ref:
- docs/12_データバックアップ機能設計.md#6 CarpoolRepositoryインターフェースの拡張
  （実装上の注意（Firestore）・実装上の注意（Dexie）を含む）
- docs/05_データ設計.md#12 削除方針（例外：データのバックアップ（読み込み）による全置換）

---

## 2. このタスクのゴール

バックアップ読み込み専用の全データ削除メソッド`clearAllData`を`CarpoolRepository`に
追加し、Firestore・Dexie両方に実装する。対象は families・players・coaches・
familyMembers・pickupLocations・destinations・events（配下のresponses・carpoolsを
含む）の全件。`staffUsers`は対象外。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/CarpoolRepository.ts`（`clearAllData`の型追加）
- `src/repositories/firestore/clearAllData.ts`（新規）
- `src/repositories/firestore/index.ts`（マージ）
- `src/repositories/dexie/clearAllData.ts`（新規）
- `src/repositories/dexie/index.ts`（マージ）

※`clearAllData`は特定の1エンティティに属さず全コレクション／全テーブルを横断するため、
他タスクより1ファイル多い5ファイルになる（`50_タスク作成ルール.md`の「目安1〜3ファイル」
から外れるが、Firestore・Dexieいずれも単体では意味を持たない1つの機能のため分割しない）。

---

## 4. 実装範囲（やること）

### Firestore（`firestore/clearAllData.ts`）

- `services/dev/seedSampleData.ts`の`deleteAllDocsInCollection`・
  `deleteAllEventsWithSubcollections`と同じ方式（全件取得→`writeBatch`で400〜500件
  区切りの削除）で実装する
- families・players・coaches・familyMembers・pickupLocations・destinationsの各
  コレクションを`deleteAllDocsInCollection`相当の処理で削除する
- eventsは`deleteAllEventsWithSubcollections`相当の処理で、各イベントのresponses・
  carpoolsサブコレクションを先に削除してからevent本体を削除する
- `staffUsers`コレクションは削除しない
- `firestore/index.ts`に`clearAllDataRepository`（または同等の名前）をマージする

### Dexie（`dexie/clearAllData.ts`）

- `db.transaction('rw', [db.families, db.players, db.coaches, db.familyMembers,
  db.pickupLocations, db.destinations, db.events, db.responses, db.carpools], async () => {
  ... })`で全9テーブルを`clear()`する（IndexedDBはDB内トランザクションが可能なため、
  Firestore版と異なり途中失敗時の不完全な状態が起きない）
- `dexie/index.ts`に`clearAllDataRepository`（または同等の名前）をマージする

---

## 5. 実装範囲外（やらないこと）

- 各エンティティの`restore*`実装（T95〜T101で完了済み前提）
- `backupService`（`clearAllData`の呼び出し元、T103）
- `services/dev/seedSampleData.ts`との共通化・置き換え
  （`docs/12_データバックアップ機能設計.md`8章「サンプルデータ投入機能との統合」で
  別タスクとして扱う。本タスクではロジックが重複することを許容する）

---

## 6. 受け入れ条件

- `CarpoolRepository`に`clearAllData(): Promise<void>;`が追加されている
- Firestore・Dexie両方に実装され、`repository.clearAllData()`として呼び出せる
- `npm run build`が成功する
- `clearAllData()`実行後、`getFamilies()`・`getPickupLocations()`・
  `getUpcomingEvents(todayDate)`等が空配列を返す
- `clearAllData()`実行後も`staffUsers`コレクションのドキュメントは残っている（Firestore版）

---

## 7. 依存タスク

- T95〜T101（全エンティティの`restore*`実装。`CarpoolRepository.ts`への追記を直列で進める）

---

## 提案（タスク対象外）

なし
