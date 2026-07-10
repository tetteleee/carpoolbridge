# Task007a イベント・回答のFirestore移行

Version: 1.0

---

# 目的

Task003（イベント作成）・Task004（回答入力）で使用しているインメモリの
モックストア（`eventStore`等）を廃止し、`events`・
`events/{eventId}/responses` を実際にFirestoreへ移行する。
既存のホーム画面・イベント作成画面・イベント編集画面をFirestore参照へ
書き換える。

Carpool（配車結果）のFirestore化は、次のTask007（配車画面）で行う
（本Taskのスコープ外）。

---

# 背景

Task006でfamilies・children・pickupLocations・destinationsは
既にFirestore化済みだが、events・responsesだけがインメモリのまま
残っており、データソースが分裂した状態になっている。

Task007（配車画面）は「イベント・家庭・子供・回答」を組み合わせて
表示する必要があるため、その前提としてイベント・回答のデータソースを
Firestoreに統一しておく。

---

# 完了条件

- `events` コレクションへイベントの読み書きができる（一覧取得・新規作成）
- `events/{eventId}/responses` サブコレクションへ回答の読み書きができる
- ホーム画面（Task002）がFirestoreから取得したイベント一覧を表示する
- イベント作成画面（Task003）が保存時にFirestoreへイベントを作成する
- イベント編集画面（Task004）が、開いたときにFirestoreから回答を読み込み、
  未回答の家庭には初期状態（`status: "未回答"`）のResponseを自動生成する
- イベント編集画面での変更が都度Firestoreへ自動保存される
- `src/mocks/eventStore.ts` への参照がコード内から全て削除される
- npm run build が成功する

---

# 実装内容

## 1. 型定義の見直し

`src/types.ts` の `Event`・`Response`・`ChildResponse` を
04_データ設計.md 8・9章に厳密に準拠させる（`createdAt`・`updatedAt`を
`Timestamp`として追加する等）。

```typescript
export interface Event {
  id: string;
  name: string;
  destinationId: string | null;
  destinationName: string;
  latitude: number;
  longitude: number;
  status: EventStatus;
}
```

※`date`フィールド（Task002で定義）は04_データ設計.mdには存在しないため、
`createdAt`等と混同しないよう、既存の`date`の扱いをどうするか実装時に
確認する（イベント自体の開催日を表すフィールドとして、04_データ設計.mdに
記載がない項目のため、既存Task002〜004との整合を優先し`date`は
維持してよい）。

---

## 2. Firestoreアクセス関数

`src/firestore/events.ts` を新規作成する。

```typescript
export async function listEvents(): Promise<Event[]> { ... }
export async function getEvent(id: string): Promise<Event | null> { ... }
export async function addEvent(input: Omit<Event, "id">): Promise<string> { ... }
export async function updateEvent(id: string, input: Partial<Event>): Promise<void> { ... }
```

`src/firestore/responses.ts` を新規作成する。

```typescript
export async function listResponses(eventId: string): Promise<Response[]> { ... }

// 家庭ごとに、既存のResponseがあればそれを、無ければ
// status: "未回答" の初期Responseを生成してFirestoreへ書き込み、返す
export async function getOrCreateResponse(
  eventId: string,
  familyId: string
): Promise<Response> { ... }

export async function upsertResponse(
  eventId: string,
  familyId: string,
  input: Partial<Response>
): Promise<void> { ... }
```

コレクション構成は04_データ設計.md 11章に準拠する。

---

## 3. HomePage の書き換え

Task002で実装済みの`HomePage.tsx`を、`getEvents()`（モック）から
`listEvents()`（Firestore、非同期）へ切り替える。

- 取得中はローディング表示を行う
- 取得失敗時は簡易的なエラーメッセージを表示する

---

## 4. CreateEventPage の書き換え

Task003で実装済みの`CreateEventPage.tsx`を、`addEvent()`（モック）から
Firestore版の`addEvent()`へ切り替える。

- 保存中はボタンを無効化し、二重送信を防ぐ
- 保存完了後にホーム画面へ遷移する（既存仕様を維持）

---

## 5. EventEditPage の書き換え

Task004で実装済みの回答入力画面を、Firestore参照へ切り替える。

- 画面を開いたら、対象イベントの全家庭（`families`、`isActive: true`のみ）
  に対して`getOrCreateResponse`を呼び出し、Response一覧を組み立てる
- 各項目（参加・車出し・乗車可能人数・コーチ参加・備考等）の変更時に
  `upsertResponse`を呼び出し、Firestoreへ自動保存する
- 「未回答」から何らかの項目を操作した際に自動的に「回答済み」へ
  切り替わる既存仕様（Task004）を、Firestore版でも維持する

---

## 6. モックストアの整理

`src/mocks/eventStore.ts` を削除する。

`src/mocks/events.ts`・`src/mocks/families.ts`等の静的モックデータ自体は、
今後の開発・動作確認用シードデータとして残してよいが、
本番コード（pages配下）からの参照は完全に除去する。

---

# スコープ外

以下は実装しない。

- Carpool（配車結果）のFirestore化（Task007「配車画面」で対応）
- 自動配車ロジック（Task007・Task009で対応）
- 集合場所・目的地の登録UI変更（Task006のまま）
- 楽観的ロック・同時編集の考慮（MVPでは対象外）
- イベントの削除・アーカイブ機能

---

# 確認項目

```
□ npm run build が成功する

□ ホーム画面がFirestoreのevents一覧を表示する
  （モックの3件が初期表示されないこと）

□ イベント作成画面から保存すると、Firestoreにドキュメントが作られ、
  ホーム画面に反映される

□ 回答入力画面を開くと、登録済みの全家庭に対してResponseが
  表示される（未登録の家庭は自動的に「未回答」状態で作成される）

□ 回答入力画面での編集がFirestoreへ反映され、リロードしても
  保持される

□ 「未回答」の家庭を操作すると自動的に「回答済み」になる
  （Task004の既存仕様を再確認）

□ src/mocks/eventStore.ts への参照がコード内に残っていない
```

---

# 参照ドキュメント

04_データ設計.md
・8章 Event
・9章 Response
・11章 Firestore構成

03_ユースケース.md
・UC-01 イベントを作成する
・UC-02 LINE回答を入力する
・UC-03 回答を修正する
・UC-04 回答状況を確認する

Task002・Task003・Task004（書き換え対象の既存実装）

Task006（Firestoreアクセス関数の実装パターンを踏襲）

---

# 実装ルール

- TypeScriptで実装する
- anyは使用しない
- 関数コンポーネント・Hooksで実装する
- React Hooksのルールを守る
- MVPなので過剰な抽象化はしない
- Firestoreアクセスは`src/firestore/`配下の関数経由に統一する

---

# 実装ツールへの指示

以下を厳守すること。

- Taskに書かれた内容のみ実装する
- Carpool関連のコード・型を追加しない（Task007のスコープ）
- 自動配車ロジックを追加しない（Task007・Task009のスコープ）
- Task001〜006で作成済みのルーティング・認証ゲート・マスタ管理機能を
  壊さない
- 分からない仕様は推測せず質問する
