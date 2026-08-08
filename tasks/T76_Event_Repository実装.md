# Task T76 Event Repository実装

---

## 1. 対象設計書

ref:
- docs/08_公開版アーキテクチャ設計.md#5 CarpoolRepositoryインターフェース（Eventセクション、ファイル構成）
- docs/08_公開版アーキテクチャ設計.md#7 Repositoryに含めない処理（`eventService.deleteEvent`のカスケード）
- docs/05_データ設計.md#7 Event

---

## 2. このタスクのゴール

`services/event/eventService.ts`が直接呼んでいるFirestore SDKの呼び出しを、
`src/repositories/firestore/eventRepository.ts`（新規）へ移す。単純なCRUD関数
（`createEvent`・`getUpcomingEvents`・`getPastEventsCount`・`getPastEventsPage`・
`getEvent`・`updateEvent`）は1行委譲に置き換える。`deleteEvent`（回答・配車結果の
カスケード削除を含む）は`eventService.ts`に関数として残すが、内部でFirestoreの
`writeBatch`等を直接呼ぶのをやめ、Repositoryのプリミティブ（`repository.deleteAllResponses`・
`repository.deleteAllCarpools`）を順に呼ぶだけの実装に書き換える。
コンポーネント側の呼び出し元は一切変更しない。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/firestore/eventRepository.ts`（新規）
- `src/repositories/firestore/index.ts`（`eventRepository`の内容をマージ）
- `src/services/event/eventService.ts`（内部実装をRepository呼び出しへ置き換え）

---

## 4. 実装範囲（やること）

- `eventRepository.ts`に、`CarpoolRepository`インターフェースのEvent部分
  （`createEvent`・`getUpcomingEvents`・`getPastEventsCount`・`getPastEventsPage`・
  `getEvent`・`updateEvent`・`deleteEvent`＝単一ドキュメント削除のみ）を実装する。
  実装内容は現在`eventService.ts`にあるFirestore SDK呼び出しをそのまま移植する
  （ページネーション・カーソル処理を含め、ロジック自体は変更しない）
- `firestore/index.ts`に`eventRepository`の内容をマージし、`FirestoreRepository`
  オブジェクトの一部として公開する
- `eventService.ts`の`createEvent`・`getUpcomingEvents`・`getPastEventsCount`・
  `getPastEventsPage`・`getEvent`・`updateEvent`を、対応する`repository.xxx(...)`への
  1行委譲に書き換える
- `eventService.ts`の`deleteEvent`（カスケード関数）は関数として残すが、実装を
  以下の順でRepositoryのプリミティブを呼ぶだけに書き換える。
  1. `repository.deleteAllResponses(eventId)`（T74で実装済みのResponse Repository）
  2. `repository.deleteAllCarpools(eventId)`（T75で実装済みのCarpool Repository）
  3. `repository.deleteEvent(eventId)`（本タスクで実装したEvent Repositoryの単一ドキュメント削除）

  **注意**: 現状の`deleteEvent`は内部の`deleteAllDocsInCollection`ヘルパーで
  400件ずつの`writeBatch`チャンク削除を行っているが、`repository.deleteAllResponses`・
  `repository.deleteAllCarpools`（T74・T75で実装済み）はチャンクしない
  `Promise.all(docs.map(deleteDoc))`方式である。本タスクではRepositoryプリミティブの
  再利用を優先し、`deleteAllDocsInCollection`ヘルパーは削除してこちらに統一する
  （1イベントあたりの回答・配車結果件数は数十件程度を想定しており、400件チャンクの
  必要性は実運用上ないため。詳細は本タスク完了後、必要に応じて`09_今後のアイデア.md`へ
  検討事項として記録してもよい）
- `eventService.ts`からFirestore SDK（`firebase/firestore`）のimportをすべて削除する

---

## 5. 実装範囲外（やらないこと）

- 他エンティティのRepository実装（すべて完了済み。本タスクが最後）
- コンポーネント・ページ・hooks側の呼び出し元コードの変更
  （`services/event/eventService.ts`を経由し続けるため対象外。
  docs/08_公開版アーキテクチャ設計.md#2参照）
- `deleteEvent`のカスケード対象・順序の変更（削除対象・順序自体は現状を踏襲する。
  内部実装の統一のみ行う）
- `DexieRepository`の実装（対象外）

---

## 6. 受け入れ条件

- `eventService.ts`に`firebase/firestore`からのimportが存在しない
- `eventService.ts`の各関数のシグネチャ（引数・戻り値の型）が変更前と一致する
- イベントを削除すると、配下の回答・配車結果（行き・帰り両方向）もこれまで通り削除される
- ホーム画面の「過去のイベント」ページネーション（`getPastEventsPage`）がこれまで通り動作する
- `npm run build`が成功する
- `npm run test:e2e`が変更前と同じ結果（既存のグリーンなテストがグリーンのまま）になる

---

## 7. 依存タスク

- T67 型定義変更・CarpoolRepositoryインターフェース定義
- T74 Response Repository実装（`deleteAllResponses`を使用）
- T75 Carpool Repository実装（`deleteAllCarpools`を使用）

---

## 提案（タスク対象外）

なし
