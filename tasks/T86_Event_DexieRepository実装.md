# Task T86 Event DexieRepository実装

---

## 1. 対象設計書

ref:
- docs/10_DexieRepository実装設計.md#4 Dexieスキーマ設計
- docs/08_公開版アーキテクチャ設計.md#5,#7 CarpoolRepositoryインターフェース（Eventセクション）・
  Repositoryに含めない処理

---

## 2. このタスクのゴール

`CarpoolRepository`インターフェースのEvent部分を、`src/repositories/dexie/eventRepository.ts`
（新規）にDexie（IndexedDB）版として実装する。T76（Firestore版）と同様、単一レコードの
CRUDのみを実装し、`deleteEvent`のカスケード削除（回答・配車結果の道連れ削除）は
実装しない（`services/event/eventService.ts`側で既にストレージ非依存な形で実装済みのため）。

`getPastEventsPage`（過去イベントのカーソルページネーション）は、Firestoreのような
サーバー側複合カーソルクエリがDexieにはないため、メモリ上でのソート＋スライスで
同等の結果を実現する。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/dexie/eventRepository.ts`（新規）
- `src/repositories/dexie/index.ts`（`eventRepository`の内容をマージ）

---

## 4. 実装範囲（やること）

`db.events`（T77で定義済み）に対して、以下を実装する。

- `createEvent(data)`: `crypto.randomUUID()`でid発行、`createdAt`/`updatedAt`に
  `new Date()`を付与して`db.events.add(...)`。idを返す
- `getUpcomingEvents(todayDate)`: `db.events.where('date').aboveOrEqual(todayDate).sortBy('date')`
  （日付昇順）
- `getPastEventsCount(todayDate)`: `db.events.where('date').below(todayDate).count()`
- `getPastEventsPage(todayDate, cursor)`:
  1. `db.events.where('date').below(todayDate).toArray()`で開催日を過ぎたイベントを全件取得する
     （1チームあたりのイベント数は数百件程度を想定しており、全件メモリロードで問題ない。
     T76の`deleteAllDocsInCollection`廃止時の判断と同じ考え方）
  2. `(date desc, id desc)`でソートする（Firestore版の`orderBy('date','desc'),
     orderBy(documentId(),'desc')`と同じ並び順）
  3. `cursor`が`null`でなければ、ソート済み配列から「`cursor`と同じ位置」より後ろの要素のみに
     絞り込む（`date`が`cursor.date`より過去、または`date`が等しく`id`が`cursor.id`より
     小さい要素）
  4. 絞り込んだ配列の先頭から`PAST_EVENTS_PAGE_SIZE`件を`events`として返し、
     残りが存在すれば`hasMore: true`
- `getEvent(eventId)`: `db.events.get(eventId)`。存在しない場合は`null`
- `updateEvent(eventId, data)`: `updatedAt: new Date()`を付与して`db.events.update(eventId, ...)`
- `deleteEvent(eventId)`: 単一レコードの削除のみ。`db.events.delete(eventId)`
  （回答・配車結果の道連れ削除は行わない。`services/event/eventService.ts`の`deleteEvent`が
  `repository.deleteAllResponses`・`repository.deleteAllCarpools`を順に呼ぶことで実現しており、
  T84・T85で実装済みのプリミティブがそのまま使われる）

`PAST_EVENTS_PAGE_SIZE`定数は`eventRepository.ts`側にも定義する（T76のFirestore版と同じ値
`20`。`services/event/eventService.ts`が最終的にどちらを参照するかはT88で決定する）。

`eventRepository`を`Pick<CarpoolRepository, 'createEvent' | 'getUpcomingEvents' |
'getPastEventsCount' | 'getPastEventsPage' | 'getEvent' | 'updateEvent' | 'deleteEvent'>`型で
exportし、`dexie/index.ts`へスプレッドでマージする。

---

## 5. 実装範囲外（やらないこと）

- `deleteEvent`のカスケード処理（回答・配車結果の道連れ削除）の実装
  （`services/event/eventService.ts`側で既に完結しており、本タスクでは何もしない）
- 他エンティティのDexieRepository実装（別タスク）
- `services/event/eventService.ts`の変更（T88で一括対応）
- FirestoreRepository側の実装変更（T76で完了済み、対象外）

---

## 6. 受け入れ条件

- `dexie/index.ts`が`eventRepository`をマージした状態でビルドが通る
- `npm run build`が成功する
- `getPastEventsPage`が、`(date desc, id desc)`の並び順・`PAST_EVENTS_PAGE_SIZE`件区切りで
  Firestore版と同等の結果を返す
- 各メソッドのシグネチャが`CarpoolRepository`インターフェース・T76のFirestore版と一致する

---

## 7. 依存タスク

- T77 Dexie基盤（db.ts全テーブル定義・dexie/index.tsの空の器）
- T84 Response DexieRepository実装（`deleteAllResponses`が揃っている前提での動作確認用）
- T85 Carpool DexieRepository実装（`deleteAllCarpools`が揃っている前提での動作確認用）

---

## 提案（タスク対象外）

なし
