# Task T85 Carpool DexieRepository実装

---

## 1. 対象設計書

ref:
- docs/10_DexieRepository実装設計.md#4 Dexieスキーマ設計
- docs/08_公開版アーキテクチャ設計.md#5,#6 CarpoolRepositoryインターフェース（Carpoolセクション）・
  saveCarpoolsの新設について

---

## 2. このタスクのゴール

`CarpoolRepository`インターフェースのCarpool部分（新設の`saveCarpools`含む）を、
`src/repositories/dexie/carpoolRepository.ts`（新規）にDexie（IndexedDB）版として
実装する。T75（Firestore版）と同じメソッド構成・シグネチャで実装し、`dexie/index.ts`へ
マージする。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/dexie/carpoolRepository.ts`（新規）
- `src/repositories/dexie/index.ts`（`carpoolRepository`の内容をマージ）

---

## 4. 実装範囲（やること）

`db.carpools`（`CarpoolRecord`＝`Carpool`に`eventId`を加えた型。T77で定義済み。
`[eventId+direction]`の複合indexあり）に対して、以下を実装する。

- `createCarpool(eventId, data)`: `crypto.randomUUID()`でid発行して
  `db.carpools.add({ id, eventId, ...data })`。idを返す
- `getCarpools(eventId, direction)`: `direction`指定時は
  `db.carpools.where('[eventId+direction]').equals([eventId, direction]).toArray()`、
  未指定時は`db.carpools.where('eventId').equals(eventId).toArray()`。
  戻り値は`eventId`フィールドを除いた`Carpool`型の配列として返す
  （Firestore版がドキュメント本体＝`eventId`を含まないデータを返しているのと揃えるため）
- `getCarpool(eventId, carpoolId)`: `db.carpools.get(carpoolId)`で取得し、存在しなければ
  `null`。存在する場合は`eventId`フィールドを除いて返す
- `updateCarpool(eventId, carpoolId, data)`: `db.carpools.update(carpoolId, data)`
- `saveCarpools(eventId, carpools)`: **upsertのみ**（docs/08_公開版アーキテクチャ設計.md#6）。
  `db.transaction('rw', db.carpools, async () => { for (const carpool of carpools) {
  await db.carpools.put({ eventId, ...carpool }); } })`のようにDexieのトランザクションで
  一括put（登録済みならidの一致で上書き、未登録なら新規作成）する。渡された配列に含まれない
  他のCarpoolレコードには一切手を触れない（削除しない）。空配列の場合は何もしない
- `deleteAllCarpools(eventId)`: `db.carpools.where('eventId').equals(eventId).delete()`
- `deleteCarpool(eventId, carpoolId)`: `db.carpools.delete(carpoolId)`

`carpoolRepository`を`Pick<CarpoolRepository, 'createCarpool' | 'getCarpools' | 'getCarpool' |
'updateCarpool' | 'saveCarpools' | 'deleteAllCarpools' | 'deleteCarpool'>`型でexportし、
`dexie/index.ts`へスプレッドでマージする。

---

## 5. 実装範囲外（やらないこと）

- `deleteCarpoolsByDirection`のカスケード処理の実装（`services/event/carpoolService.ts`側で
  既に完結しており、本タスクでは何もしない）
- 他エンティティのDexieRepository実装（別タスク）
- `services/event/carpoolService.ts`・`services/carpool/carpoolMember.ts`の変更
  （T88で一括対応）
- FirestoreRepository側の実装変更（T75で完了済み、対象外）

---

## 6. 受け入れ条件

- `dexie/index.ts`が`carpoolRepository`をマージした状態でビルドが通る
- `npm run build`が成功する
- `saveCarpools`に渡した配列に含まれないCarpoolレコードが変化しないことを確認できる
  （トランザクションが渡された分だけをupsertする実装になっている）
- 各メソッドのシグネチャが`CarpoolRepository`インターフェース・T75のFirestore版と一致する

---

## 7. 依存タスク

- T77 Dexie基盤（db.ts全テーブル定義・dexie/index.tsの空の器）

---

## 提案（タスク対象外）

なし
