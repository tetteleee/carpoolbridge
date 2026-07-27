# Task T49 Event更新処理（updateEvent）

---

## 1. 対象設計書

ref:
- docs/05_データ設計.md#7 Event（イベント）
- docs/04_画面設計.md#12 イベント情報編集

---

## 2. このタスクのゴール

Eventドキュメントのイベント名・日付・目的地を更新するデータ層の処理を追加する。T18で実装済みのEvent CRUD処理には更新処理が含まれていないため、これを追加する。

---

## 3. 変更対象ファイル（想定）

- `src/services/event/eventService.ts`

※ファイル構成はプロジェクト構成に合わせて読み替えてよい。

---

## 4. 実装範囲（やること）

- `updateEvent(eventId: string, data: Pick<Event, 'name' | 'date' | 'destinationId'>): Promise<void>` を追加する
  - 対象はEventドキュメントの `name`・`date`・`destinationId` フィールドのみとする
  - `updatedAt` をサーバー時刻で更新する
  - `createdAt` は変更しない

---

## 5. 実装範囲外（やらないこと）

- Eventの削除処理
- Response（回答）データへの影響（一切行わない）
- 呼び出し元のUI（T50で実施）

---

## 6. 受け入れ条件

- `updateEvent` を呼び出すと、対象EventドキュメントのFirestore上の `name`・`date`・`destinationId`・`updatedAt` が更新される
- `createdAt` は変更されない
- Responseコレクションに書き込みが発生しない

---

## 7. 依存タスク

- T18 Event_CRUD処理

---

## 提案（タスク対象外）

なし
