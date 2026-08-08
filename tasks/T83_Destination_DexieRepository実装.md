# Task T83 Destination DexieRepository実装

---

## 1. 対象設計書

ref:
- docs/10_DexieRepository実装設計.md#3 ID生成方式
- docs/10_DexieRepository実装設計.md#4 Dexieスキーマ設計
- docs/08_公開版アーキテクチャ設計.md#5 CarpoolRepositoryインターフェース（Destinationセクション）

---

## 2. このタスクのゴール

`CarpoolRepository`インターフェースのDestination部分を、
`src/repositories/dexie/destinationRepository.ts`（新規）にDexie（IndexedDB）版として
実装する。T73（Firestore版）と同じメソッド構成・シグネチャで実装し、`dexie/index.ts`へ
マージする。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/dexie/destinationRepository.ts`（新規）
- `src/repositories/dexie/index.ts`（`destinationRepository`の内容をマージ）

---

## 4. 実装範囲（やること）

`db.destinations`（T77で定義済み）に対して、以下を実装する。PickupLocationと全く同型の構造。

- `createDestination(data)`: `crypto.randomUUID()`でid発行して`db.destinations.add(...)`。
  idを返す
- `getDestinations()`: `db.destinations.toArray()`
- `getDestination(destinationId)`: `db.destinations.get(destinationId)`。存在しない場合は
  `null`を返す
- `updateDestination(destinationId, data)`: `db.destinations.update(destinationId, data)`
- `deleteDestination(destinationId)`: `db.destinations.delete(destinationId)`

`destinationRepository`を`Pick<CarpoolRepository, 'createDestination' | ...>`型でexportし、
`dexie/index.ts`へスプレッドでマージする。

---

## 5. 実装範囲外（やらないこと）

- 他エンティティのDexieRepository実装（別タスク）
- `services/master/destinationService.ts`の変更（T88で一括対応）
- FirestoreRepository側の実装変更（T73で完了済み、対象外）

---

## 6. 受け入れ条件

- `dexie/index.ts`が`destinationRepository`をマージした状態でビルドが通る
- `npm run build`が成功する
- 各メソッドのシグネチャが`CarpoolRepository`インターフェース・T73のFirestore版と一致する

---

## 7. 依存タスク

- T77 Dexie基盤（db.ts全テーブル定義・dexie/index.tsの空の器）

---

## 提案（タスク対象外）

なし
