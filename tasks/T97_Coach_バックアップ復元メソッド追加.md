# Task T97 Coach バックアップ復元メソッド追加

---

## 1. 対象設計書

ref:
- docs/12_データバックアップ機能設計.md#6 CarpoolRepositoryインターフェースの拡張
- docs/05_データ設計.md#4a Coach

---

## 2. このタスクのゴール

バックアップの読み込みで、元のIDのままコーチデータを書き込めるようにする`restoreCoach`
メソッドを`CarpoolRepository`に追加し、Firestore・Dexie両方に実装する。T95と同じ
パターンで実装する。既存の`createCoach`には一切手を触れない。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/CarpoolRepository.ts`（`restoreCoach`の型追加）
- `src/repositories/firestore/coachRepository.ts`（実装追加）
- `src/repositories/dexie/coachRepository.ts`（実装追加）

---

## 4. 実装範囲（やること）

- `CarpoolRepository`インターフェースに`restoreCoach(coach: Coach): Promise<void>;`を追加する
- `firestore/coachRepository.ts`：`Pick<...>`に`'restoreCoach'`を追加し、
  `setDoc(doc(db, firestorePaths.coachDocument(coach.id)), { familyId, name, isActive,
  createdAt: Timestamp.fromDate(coach.createdAt), updatedAt: Timestamp.fromDate(coach.updatedAt) })`
  で実装する。`serverTimestamp()`は使わず、バックアップファイルの値をそのまま書き込む（T95参照）
- `dexie/coachRepository.ts`：`Pick<...>`に`'restoreCoach'`を追加し、
  `db.coaches.put({ ...coach })`で実装する

---

## 5. 実装範囲外（やらないこと）

- 他エンティティの`restore*`実装
- `clearAllData`・`backupService`（T102、T103）
- 既存`createCoach`等、他メソッドの変更

---

## 6. 受け入れ条件

- `CarpoolRepository`に`restoreCoach`が追加されている
- Firestore・Dexie両方に実装され、`repository.restoreCoach`として呼び出せる
- `npm run build`が成功する
- `restoreCoach`実行後、`getCoachesByFamilyId(coach.familyId)`に渡した内容と
  同じ`Coach`が含まれる

---

## 7. 依存タスク

- T96 Player バックアップ復元メソッド追加（`CarpoolRepository.ts`への追記を直列で進める）

---

## 提案（タスク対象外）

なし
