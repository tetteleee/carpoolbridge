# Task T79 Coach DexieRepository実装

---

## 1. 対象設計書

ref:
- docs/10_DexieRepository実装設計.md#3 ID生成方式
- docs/10_DexieRepository実装設計.md#4 Dexieスキーマ設計
- docs/08_公開版アーキテクチャ設計.md#5 CarpoolRepositoryインターフェース（Coachセクション）

---

## 2. このタスクのゴール

`CarpoolRepository`インターフェースのCoach部分を、`src/repositories/dexie/coachRepository.ts`
（新規）にDexie（IndexedDB）版として実装する。T69（Firestore版）と同じメソッド構成・
シグネチャで実装し、`dexie/index.ts`へマージする。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/dexie/coachRepository.ts`（新規）
- `src/repositories/dexie/index.ts`（`coachRepository`の内容をマージ）

---

## 4. 実装範囲（やること）

`db.coaches`（T77で定義済み）に対して、以下を実装する。Playerと全く同型の構造。

- `createCoach(data)`: `crypto.randomUUID()`でid発行、`isActive: true`・
  `createdAt`/`updatedAt`に`new Date()`を付与して`db.coaches.add(...)`。idを返す
- `getCoachesByFamilyId(familyId)`: `db.coaches.where('familyId').equals(familyId).toArray()`
- `getAllCoaches()`: `db.coaches.toArray()`
- `updateCoach(coachId, data)`: `updatedAt: new Date()`を付与して`db.coaches.update(coachId, ...)`
- `deleteCoach(coachId)`: `db.coaches.delete(coachId)`
- `deleteCoachesByFamilyId(familyId)`: `db.coaches.where('familyId').equals(familyId).delete()`

`coachRepository`を`Pick<CarpoolRepository, 'createCoach' | 'getCoachesByFamilyId' | ...>`型で
exportし、`dexie/index.ts`へスプレッドでマージする。

---

## 5. 実装範囲外（やらないこと）

- 他エンティティのDexieRepository実装（別タスク）
- `services/master/coachService.ts`の変更（T88で一括対応）
- FirestoreRepository側の実装変更（T69で完了済み、対象外）

---

## 6. 受け入れ条件

- `dexie/index.ts`が`coachRepository`をマージした状態でビルドが通る
- `npm run build`が成功する
- 各メソッドのシグネチャが`CarpoolRepository`インターフェース・T69のFirestore版と一致する

---

## 7. 依存タスク

- T77 Dexie基盤（db.ts全テーブル定義・dexie/index.tsの空の器）

---

## 提案（タスク対象外）

なし
