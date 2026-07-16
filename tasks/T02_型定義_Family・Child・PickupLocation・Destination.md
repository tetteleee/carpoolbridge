# Task T02 型定義：Family・Child・PickupLocation・Destination

---

## 1. 対象設計書

ref: docs/05_データ設計.md#3 Family（家庭）、#4 Child（子供）、#5 PickupLocation（集合場所）、#6 Destination（目的地）

---

## 2. このタスクのゴール

マスタデータ4種（Family・Child・PickupLocation・Destination）のTypeScript型定義を作成する。

---

## 3. 変更対象ファイル

- `src/types/master.ts`（新規作成）

---

## 4. 実装範囲（やること）

05_データ設計.md 3〜6章の項目定義に従い、以下4つの型を `src/types/master.ts` に定義する。

- `Family` 型
  - `id: string`
  - `familyName: string`
  - `coachName: string | null`
  - `vehicleCapacity: number`
  - `pickupLocationId: string`
  - `isActive: boolean`
  - `createdAt: Timestamp`
  - `updatedAt: Timestamp`
- `Child` 型
  - `id: string`
  - `familyId: string`
  - `name: string`
  - `schoolEntryYear: number`
  - `pickupLocationOverride: string | null`
  - `isActive: boolean`
  - `createdAt: Timestamp`
  - `updatedAt: Timestamp`
- `PickupLocation` 型
  - `id: string`
  - `name: string`
  - `address: string`
  - `latitude: number`
  - `longitude: number`
- `Destination` 型
  - `id: string`
  - `name: string`
  - `address: string | undefined`（必須「」＝任意項目のため）
  - `latitude: number`
  - `longitude: number`

`Timestamp` 型は `firebase/firestore` からimportして使用する（Firestoreを利用するプロジェクトのため）。

各型には、設計書記載の説明文をJSDocコメントとして付与してよい（型定義そのものの追加・変更にはあたらない）。

---

## 5. 実装範囲外（やらないこと・触らないこと）

- Event・Response・Carpoolの型定義（T03で対応）
- Firestoreコレクションパス定数の定義（T04で対応）
- 各型に対するCRUD処理・バリデーションロジックの実装（T09〜T12で対応）
- `schoolEntryYear` から学年を自動計算するロジックの実装（本タスクは型定義のみ）
- `coachName` の有無によって `coachParticipating` の入力可否を判定するロジック（Response側、T27等で対応）
- 家庭無効化時の子供連動無効化ロジックの実装（T12で対応）
- 型定義以外のファイル（コンポーネント・Firestoreルール等）の変更

---

## 6. 受け入れ条件

- `src/types/master.ts` が作成されている
- `Family`・`Child`・`PickupLocation`・`Destination` の4つの型が定義されている
- 各型のフィールド名・型・必須/任意（`| null` の有無を含む）が05_データ設計.md 3〜6章の表と一致している
- TypeScriptのビルド（型チェック）がエラーなく通る

---

## 7. 依存タスク

なし（バックログ記載通り）

---

## 備考（矛盾点の指摘のみ・設計変更提案ではない）

- `Destination.address` は05_データ設計.md#6の表で必須列が空欄（未記入）になっており、必須か任意か明記されていない。本タスクでは同表内の他項目の表記慣習（必須○/空欄=任意）に基づき「任意項目」として扱い `string | undefined` とした。仕様として空欄=任意であることの確認は人間側の判断を仰ぐこと。
- `Timestamp` の具体的な型（`firebase/firestore` の `Timestamp` を使うか、`Date` や `number` を使うか）は05_データ設計.md本文には明記されていない。技術スタックがFirebase/Firestoreであること（PROJECT.md記載）から `firebase/firestore` の `Timestamp` 型を採用したが、これが妥当かは人間側の確認を仰ぐこと。
