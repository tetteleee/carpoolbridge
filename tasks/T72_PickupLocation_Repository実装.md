# Task T72 PickupLocation Repository実装

---

## 1. 対象設計書

ref:
- docs/08_公開版アーキテクチャ設計.md#5 CarpoolRepositoryインターフェース（PickupLocationセクション、ファイル構成）
- docs/05_データ設計.md#5 PickupLocation

---

## 2. このタスクのゴール

`services/master/pickupLocationService.ts`が直接呼んでいるFirestore SDKの呼び出しを、
`src/repositories/firestore/pickupLocationRepository.ts`（新規）へ移す。
`pickupLocationService.ts`の公開関数（名前・シグネチャ）は変更せず、内部実装だけを
Repository呼び出しへの1行委譲に置き換える。コンポーネント側の呼び出し元は一切変更しない。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/firestore/pickupLocationRepository.ts`（新規）
- `src/repositories/firestore/index.ts`（`pickupLocationRepository`の内容をマージ）
- `src/services/master/pickupLocationService.ts`（内部実装をRepository呼び出しへ置き換え）

---

## 4. 実装範囲（やること）

- `pickupLocationRepository.ts`に、`CarpoolRepository`インターフェースのPickupLocation部分
  （`createPickupLocation`・`getPickupLocations`・`getPickupLocation`・
  `updatePickupLocation`・`deletePickupLocation`）を実装する。実装内容は現在
  `pickupLocationService.ts`にあるFirestore SDK呼び出しをそのまま移植する
  （ロジック自体は変更しない）
- `firestore/index.ts`に`pickupLocationRepository`の内容をマージし、`FirestoreRepository`
  オブジェクトの一部として公開する
- `pickupLocationService.ts`の各エクスポート関数を、対応する`repository.xxx(...)`への
  1行委譲に書き換える。`pickupLocationService.ts`からFirestore SDK（`firebase/firestore`）の
  importをすべて削除する

---

## 5. 実装範囲外（やらないこと）

- 他エンティティ（Destination等）のRepository実装（別タスク）
- コンポーネント・ページ・hooks側の呼び出し元コードの変更
  （`services/master/pickupLocationService.ts`を経由し続けるため対象外。
  docs/08_公開版アーキテクチャ設計.md#2参照）
- `DexieRepository`の実装（対象外）

---

## 6. 受け入れ条件

- `pickupLocationService.ts`に`firebase/firestore`からのimportが存在しない
- `pickupLocationService.ts`の各関数のシグネチャ（引数・戻り値の型）が変更前と一致する
- `npm run build`が成功する
- `npm run test:e2e`が変更前と同じ結果（既存のグリーンなテストがグリーンのまま）になる

---

## 7. 依存タスク

- T67 型定義変更・CarpoolRepositoryインターフェース定義

---

## 提案（タスク対象外）

なし
