# Task T68 Player Repository実装

---

## 1. 対象設計書

ref:
- docs/08_公開版アーキテクチャ設計.md#5 CarpoolRepositoryインターフェース（Playerセクション、ファイル構成）
- docs/05_データ設計.md#4 Player

---

## 2. このタスクのゴール

`services/master/playerService.ts`が直接呼んでいるFirestore SDKの呼び出しを、
`src/repositories/firestore/playerRepository.ts`（新規）へ移す。
`playerService.ts`の公開関数（名前・シグネチャ）は変更せず、内部実装だけを
Repository呼び出しへの1行委譲に置き換える。コンポーネント側の呼び出し元は一切変更しない。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/firestore/playerRepository.ts`（新規）
- `src/repositories/firestore/index.ts`（`playerRepository`の内容をマージ）
- `src/services/master/playerService.ts`（内部実装をRepository呼び出しへ置き換え）

---

## 4. 実装範囲（やること）

- `playerRepository.ts`に、`CarpoolRepository`インターフェースのPlayer部分
  （`createPlayer`・`getPlayersByFamilyId`・`getAllPlayers`・`updatePlayer`・
  `deactivatePlayer`・`deletePlayer`・`deletePlayersByFamilyId`）を実装する。
  実装内容は現在`playerService.ts`にあるFirestore SDK呼び出しをそのまま移植する
  （ロジック自体は変更しない）
- `firestore/index.ts`に`playerRepository`の内容をマージし、`FirestoreRepository`
  オブジェクトの一部として公開する
- `playerService.ts`の各エクスポート関数を、対応する`repository.xxx(...)`への
  1行委譲に書き換える（例: `export const getAllPlayers = () => repository.getAllPlayers();`）。
  `playerService.ts`からFirestore SDK（`firebase/firestore`）のimportをすべて削除する

---

## 5. 実装範囲外（やらないこと）

- 他エンティティ（Family・Coach・FamilyMember等）のRepository実装（別タスク）
- コンポーネント・ページ・hooks側の呼び出し元コードの変更
  （`services/master/playerService.ts`を経由し続けるため対象外。
  docs/08_公開版アーキテクチャ設計.md#2参照）
- `DexieRepository`の実装（対象外）

---

## 6. 受け入れ条件

- `playerService.ts`に`firebase/firestore`からのimportが存在しない
- `playerService.ts`の各関数のシグネチャ（引数・戻り値の型）が変更前と一致する
- `npm run build`が成功する
- `npm run test:e2e`が変更前と同じ結果（既存のグリーンなテストがグリーンのまま）になる

---

## 7. 依存タスク

- T67 型定義変更・CarpoolRepositoryインターフェース定義

---

## 提案（タスク対象外）

なし
