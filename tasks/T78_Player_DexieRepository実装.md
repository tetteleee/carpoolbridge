# Task T78 Player DexieRepository実装

---

## 1. 対象設計書

ref:
- docs/10_DexieRepository実装設計.md#3 ID生成方式
- docs/10_DexieRepository実装設計.md#4 Dexieスキーマ設計
- docs/08_公開版アーキテクチャ設計.md#5 CarpoolRepositoryインターフェース（Playerセクション）

---

## 2. このタスクのゴール

`CarpoolRepository`インターフェースのPlayer部分を、`src/repositories/dexie/playerRepository.ts`
（新規）にDexie（IndexedDB）版として実装する。T68（Firestore版）と同じメソッド構成・
シグネチャで実装し、`dexie/index.ts`へマージする。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/dexie/playerRepository.ts`（新規）
- `src/repositories/dexie/index.ts`（`playerRepository`の内容をマージ）

---

## 4. 実装範囲（やること）

`db.players`（T77で定義済み）に対して、以下を実装する。

- `createPlayer(data)`: `crypto.randomUUID()`でid発行、`isActive: true`・
  `createdAt`/`updatedAt`に`new Date()`を付与して`db.players.add(...)`。idを返す
- `getPlayersByFamilyId(familyId)`: `db.players.where('familyId').equals(familyId).toArray()`
- `getAllPlayers()`: `db.players.toArray()`
- `updatePlayer(playerId, data)`: `updatedAt: new Date()`を付与して`db.players.update(playerId, ...)`
- `deactivatePlayer(playerId)`: `db.players.update(playerId, { isActive: false, updatedAt: new Date() })`
- `deletePlayer(playerId)`: `db.players.delete(playerId)`
- `deletePlayersByFamilyId(familyId)`: `db.players.where('familyId').equals(familyId).delete()`

`playerRepository`を`Pick<CarpoolRepository, 'createPlayer' | 'getPlayersByFamilyId' | ...>`型で
export し、`dexie/index.ts`へスプレッドでマージする（T68のFirestore版と同じ構成）。

---

## 5. 実装範囲外（やらないこと）

- 他エンティティのDexieRepository実装（別タスク）
- `services/master/playerService.ts`の変更（T88で一括対応。現時点ではFirestore版を
  参照したまま）
- FirestoreRepository側の実装変更（T68で完了済み、対象外）

---

## 6. 受け入れ条件

- `dexie/index.ts`が`playerRepository`をマージした状態でビルドが通る
- `npm run build`が成功する
- 各メソッドのシグネチャ（引数・戻り値の型）が`CarpoolRepository`インターフェース・
  T68のFirestore版と一致する

---

## 7. 依存タスク

- T77 Dexie基盤（db.ts全テーブル定義・dexie/index.tsの空の器）

---

## 提案（タスク対象外）

なし
