# Task T67 型定義変更（Timestamp→Date）・CarpoolRepositoryインターフェース定義

---

## 1. 対象設計書

ref:
- docs/08_公開版アーキテクチャ設計.md#4 型定義の変更点
- docs/08_公開版アーキテクチャ設計.md#5 CarpoolRepositoryインターフェース（「ファイル構成」含む）

---

## 2. このタスクのゴール

`createdAt`・`updatedAt`をFirestore SDK固有の`Timestamp`型から汎用の`Date`型へ変更し、
`CarpoolRepository`インターフェースを新設する。T68以降（各エンティティのRepository実装）の
土台を作るタスクであり、このタスク単体ではFirestore呼び出しの実装は変更しない。

---

## 3. 変更対象ファイル（想定）

- `src/types/master.ts`（`Timestamp`→`Date`）
- `src/types/event.ts`（`Timestamp`→`Date`）
- `src/components/eventEdit/FamilyResponseCard.tsx`（`Timestamp`型の直接importを`Date`に変更）
- `src/repositories/CarpoolRepository.ts`（新規、インターフェース定義）
- `src/repositories/firestore/index.ts`（新規、空の`FirestoreRepository`の器のみ。中身はT68以降で追記）

※ファイル構成はプロジェクト構成に合わせて読み替えてよい。

---

## 4. 実装範囲（やること）

- `src/types/master.ts`・`src/types/event.ts`から`import { Timestamp } from 'firebase/firestore';`を削除し、
  `createdAt: Timestamp` / `updatedAt: Timestamp`をすべて`createdAt: Date` / `updatedAt: Date`に変更する
  （`PickupLocation`・`Destination`は元々`createdAt`/`updatedAt`を持たないため対象外）
- `src/components/eventEdit/FamilyResponseCard.tsx`の`import { Timestamp } from 'firebase/firestore';`を削除し、
  ローカル楽観更新用に`Timestamp.now()`を代入している2箇所（`createdAt`・`updatedAt`）を`new Date()`に置き換える
  （`src/`配下を検索した限り、`createdAt`/`updatedAt`に対して`.toDate()`等のTimestamp固有メソッドを呼んでいる
  箇所は他になく、値を表示・比較に使っている箇所もない。書き込み時にプレースホルダー値を代入するだけの
  用途のため、単純な型の置き換えで問題ない）
- `src/repositories/CarpoolRepository.ts`に、docs/08_公開版アーキテクチャ設計.md#5のインターフェース定義を
  そのまま実装する（型は本タスクで変更した`Date`ベースのものを使う）
- `src/repositories/firestore/index.ts`に、`CarpoolRepository`型を満たす`FirestoreRepository`という名前の
  オブジェクト（または関数）の空の器を作る（中身のプロパティはT68以降で追記していくため、このタスクでは
  型エラーが出ない最小限の状態でよい。例えば`Partial<CarpoolRepository>`扱いで仮置きするか、T68着手までは
  未使用のエクスポートとして置いておく）

---

## 5. 実装範囲外（やらないこと）

- 各エンティティのRepository実装本体（`familyRepository.ts`等、T68〜T76で実施）
- 既存`src/services/`配下のFirestore直接呼び出しをRepository経由に置き換える作業（T68〜T76で実施）
- `DexieRepository`の実装（対象外。docs/08_公開版アーキテクチャ設計.md#2参照）

---

## 6. 受け入れ条件

- `src/types/master.ts`・`src/types/event.ts`に`firebase/firestore`の`Timestamp`importが存在しない
- `createdAt`・`updatedAt`を持つ全ての型（`Family`・`Player`・`Coach`・`FamilyMember`・`Event`）の
  当該フィールドが`Date`型になっている
- `src/components/eventEdit/FamilyResponseCard.tsx`が`firebase/firestore`から`Timestamp`をimportしていない
- `src/repositories/CarpoolRepository.ts`が存在し、docs/08_公開版アーキテクチャ設計.md#5と同一のメソッド一覧を持つ
- `npm run build`が成功する（型変更に伴う既存コードのコンパイルエラーがすべて解消されている）

---

## 7. 依存タスク

なし

---

## 提案（タスク対象外）

なし
