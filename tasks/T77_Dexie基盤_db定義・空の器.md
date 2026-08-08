# Task T77 Dexie基盤（db.ts全テーブル定義・dexie/index.tsの空の器）

---

## 1. 対象設計書

ref:
- docs/10_DexieRepository実装設計.md#3 ID生成方式
- docs/10_DexieRepository実装設計.md#4 Dexieスキーマ設計

---

## 2. このタスクのゴール

Dexie（IndexedDB）のデータベーススキーマを定義する`src/repositories/dexie/db.ts`と、
`CarpoolRepository`の空の実装の器`src/repositories/dexie/index.ts`を新設する。
T78以降（各エンティティのDexieRepository実装）の土台を作るタスクであり、
このタスク単体では各エンティティのCRUD実装は行わない。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/dexie/db.ts`（新規）
- `src/repositories/dexie/index.ts`（新規、空の器のみ）

---

## 4. 実装範囲（やること）

- `db.ts`に、docs/10_DexieRepository実装設計.md#4のコード例の通り`CarpoolBridgeDB`クラスを実装する
  - `families`・`players`・`coaches`・`familyMembers`・`pickupLocations`・`destinations`・
    `events`・`responses`・`carpools`の9テーブルを`version(1).stores({...})`で定義する
  - `responses`テーブルはFirestoreの`events/{eventId}/responses/{familyId}`に対応する
    複合主キー`[eventId+familyId]`とし、レコード型は`Response`に`eventId`・`familyId`を
    加えた`ResponseRecord`とする
  - `carpools`テーブルは`Carpool`に`eventId`を加えた`CarpoolRecord`とし、
    `[eventId+direction]`の複合indexを持たせる（`getCarpools(eventId, direction)`用）
  - `db`という名前でシングルトンインスタンスをexportする
- `dexie/index.ts`に、`CarpoolRepository`型を満たす`dexieRepository`という名前の
  オブジェクトの空の器を作る（T67での`firestore/index.ts`と同じ要領。
  型は`Partial<CarpoolRepository>`とし、中身のプロパティはT78以降で追記していく）

---

## 5. 実装範囲外（やらないこと）

- 各エンティティのDexieRepository実装本体（`playerRepository.ts`等、T78〜T86で実施）
- `storageMode`切り替え配線（`vite.config.ts`の`resolve.alias`等、T87で実施）
- `services/`配下の呼び出し元の変更（T88で実施）

---

## 6. 受け入れ条件

- `src/repositories/dexie/db.ts`が存在し、9テーブルすべてが定義されている
- `src/repositories/dexie/index.ts`が存在し、`Partial<CarpoolRepository>`型の
  `dexieRepository`をexportしている（中身は空でよい）
- `npm run build`が成功する
- `npm ls dexie`で`dexie`パッケージが依存関係に含まれている（導入済み）

---

## 7. 依存タスク

なし（T67で定義済みの`CarpoolRepository`インターフェースを使用）

---

## 提案（タスク対象外）

なし
