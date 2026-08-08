# Task T74 Response Repository実装

---

## 1. 対象設計書

ref:
- docs/08_公開版アーキテクチャ設計.md#5 CarpoolRepositoryインターフェース（Responseセクション、ファイル構成）
- docs/05_データ設計.md#8 Response

---

## 2. このタスクのゴール

`services/event/responseService.ts`が直接呼んでいるFirestore SDKの呼び出しを、
`src/repositories/firestore/responseRepository.ts`（新規）へ移す。
`responseService.ts`の公開関数（名前・シグネチャ）は変更せず、内部実装だけを
Repository呼び出しへの1行委譲に置き換える。コンポーネント側の呼び出し元は一切変更しない。

`deleteAllResponses`は本タスクではResponse自身のプリミティブとしてのみ実装する
（イベント削除時のカスケードから呼ばれる形はT76 Eventタスクで対応する）。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/firestore/responseRepository.ts`（新規）
- `src/repositories/firestore/index.ts`（`responseRepository`の内容をマージ）
- `src/services/event/responseService.ts`（内部実装をRepository呼び出しへ置き換え）

---

## 4. 実装範囲（やること）

- `responseRepository.ts`に、`CarpoolRepository`インターフェースのResponse部分
  （`createResponse`・`updateResponse`・`getResponses`・`getResponse`・
  `isUnanswered`・`deleteAllResponses`）を実装する。実装内容は現在
  `responseService.ts`にあるFirestore SDK呼び出しをそのまま移植する
  （ロジック自体は変更しない。`createResponse`が`setDoc`による上書き挙動を
  持つ点も変更しない）
- `firestore/index.ts`に`responseRepository`の内容をマージし、`FirestoreRepository`
  オブジェクトの一部として公開する
- `responseService.ts`の各エクスポート関数を、対応する`repository.xxx(...)`への
  1行委譲に書き換える。`responseService.ts`からFirestore SDK（`firebase/firestore`）の
  importをすべて削除する

---

## 5. 実装範囲外（やらないこと）

- 他エンティティ（Event・Carpool等）のRepository実装（別タスク）
- `eventService.deleteEvent`のカスケードを`repository.deleteAllResponses`経由に
  書き換える作業（T76 Eventタスクで実施）
- コンポーネント・ページ・hooks側の呼び出し元コードの変更
  （`services/event/responseService.ts`を経由し続けるため対象外。
  docs/08_公開版アーキテクチャ設計.md#2参照）
- `DexieRepository`の実装（対象外）

---

## 6. 受け入れ条件

- `responseService.ts`に`firebase/firestore`からのimportが存在しない
- `responseService.ts`の各関数のシグネチャ（引数・戻り値の型）が変更前と一致する
- `npm run build`が成功する
- `npm run test:e2e`が変更前と同じ結果（既存のグリーンなテストがグリーンのまま）になる

---

## 7. 依存タスク

- T67 型定義変更・CarpoolRepositoryインターフェース定義

---

## 提案（タスク対象外）

なし
