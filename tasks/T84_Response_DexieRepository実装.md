# Task T84 Response DexieRepository実装

---

## 1. 対象設計書

ref:
- docs/10_DexieRepository実装設計.md#4 Dexieスキーマ設計
- docs/08_公開版アーキテクチャ設計.md#5 CarpoolRepositoryインターフェース（Responseセクション）

---

## 2. このタスクのゴール

`CarpoolRepository`インターフェースのResponse部分を、
`src/repositories/dexie/responseRepository.ts`（新規）にDexie（IndexedDB）版として
実装する。T74（Firestore版）と同じメソッド構成・シグネチャで実装し、`dexie/index.ts`へ
マージする。

Firestoreの`events/{eventId}/responses/{familyId}`というサブコレクション構造に対し、
Dexie側は`responses`テーブルの複合主キー`[eventId+familyId]`（T77で定義済み）で表現する。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/dexie/responseRepository.ts`（新規）
- `src/repositories/dexie/index.ts`（`responseRepository`の内容をマージ）

---

## 4. 実装範囲（やること）

`db.responses`（`ResponseRecord`＝`Response`に`eventId`・`familyId`を加えた型。T77で定義済み）
に対して、以下を実装する。

- `createResponse(eventId, familyId, data)`: `db.responses.put({ eventId, familyId, ...data })`。
  Firestoreの`setDoc`（既存ドキュメントがあれば上書き）と同じ上書き挙動を`put`で再現する
- `updateResponse(eventId, familyId, data)`: `db.responses.update([eventId, familyId], data)`
  （複合キーでの部分更新）
- `getResponses(eventId)`: `db.responses.where('eventId').equals(eventId).toArray()`。
  戻り値はそのまま`ResponseWithFamilyId`として返せる（レコードに`familyId`が既に含まれるため）
- `getResponse(eventId, familyId)`: `db.responses.get([eventId, familyId])`で取得し、
  存在しなければ`null`。存在する場合は`eventId`・`familyId`フィールドを除いた
  `Response`型のオブジェクトとして返す（Firestore版が`docSnap.data()`のみ＝
  `eventId`/`familyId`を含まないデータを返しているのと挙動を揃えるため）
- `isUnanswered(eventId, familyId)`: `db.responses.get([eventId, familyId])`が`undefined`なら`true`
- `deleteAllResponses(eventId)`: `db.responses.where('eventId').equals(eventId).delete()`

`responseRepository`を`Pick<CarpoolRepository, 'createResponse' | 'updateResponse' |
'getResponses' | 'getResponse' | 'isUnanswered' | 'deleteAllResponses'>`型でexportし、
`dexie/index.ts`へスプレッドでマージする。

---

## 5. 実装範囲外（やらないこと）

- 他エンティティのDexieRepository実装（別タスク）
- `services/event/responseService.ts`の変更（T88で一括対応）
- FirestoreRepository側の実装変更（T74で完了済み、対象外）

---

## 6. 受け入れ条件

- `dexie/index.ts`が`responseRepository`をマージした状態でビルドが通る
- `npm run build`が成功する
- `getResponse`・`getResponses`の戻り値に、Response型に存在しない余分なフィールドが
  漏れていない（`getResponse`は`eventId`・`familyId`を含まない）
- 各メソッドのシグネチャが`CarpoolRepository`インターフェース・T74のFirestore版と一致する

---

## 7. 依存タスク

- T77 Dexie基盤（db.ts全テーブル定義・dexie/index.tsの空の器）

---

## 提案（タスク対象外）

なし
