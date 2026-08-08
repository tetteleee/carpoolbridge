# Task T71 Family Repository実装

---

## 1. 対象設計書

ref:
- docs/08_公開版アーキテクチャ設計.md#5 CarpoolRepositoryインターフェース（Familyセクション、ファイル構成）
- docs/08_公開版アーキテクチャ設計.md#7 Repositoryに含めない処理（`familyService.deleteFamily`のカスケード）
- docs/05_データ設計.md#3 Family

---

## 2. このタスクのゴール

`services/master/familyService.ts`が直接呼んでいるFirestore SDKの呼び出しを、
`src/repositories/firestore/familyRepository.ts`（新規）へ移す。単純なCRUD関数
（`createFamily`・`getFamilies`・`getFamily`・`updateFamily`）は1行委譲に置き換える。
`deleteFamily`（選手・コーチ・家族の道連れ削除を含むカスケード処理）は
`familyService.ts`に関数として残すが、内部でFirestoreの`writeBatch`等を直接呼ぶのをやめ、
Repositoryのプリミティブ（`repository.deletePlayersByFamilyId`等）を順に呼ぶだけの
実装に書き換える。コンポーネント側の呼び出し元は一切変更しない。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/firestore/familyRepository.ts`（新規）
- `src/repositories/firestore/index.ts`（`familyRepository`の内容をマージ）
- `src/services/master/familyService.ts`（内部実装をRepository呼び出しへ置き換え）

---

## 4. 実装範囲（やること）

- `familyRepository.ts`に、`CarpoolRepository`インターフェースのFamily部分
  （`createFamily`・`getFamilies`・`getFamily`・`updateFamily`・`deleteFamily`＝
  単一ドキュメント削除のみ）を実装する。実装内容は現在`familyService.ts`にある
  Firestore SDK呼び出しをそのまま移植する（ロジック自体は変更しない）
- `firestore/index.ts`に`familyRepository`の内容をマージし、`FirestoreRepository`
  オブジェクトの一部として公開する
- `familyService.ts`の`createFamily`・`getFamilies`・`getFamily`・`updateFamily`を、
  対応する`repository.xxx(...)`への1行委譲に書き換える
- `familyService.ts`の`deleteFamily`（カスケード関数）は関数として残すが、実装を
  以下の順でRepositoryのプリミティブを呼ぶだけに書き換える。
  1. `repository.deletePlayersByFamilyId(familyId)`（T68で実装済みのPlayer Repository）
  2. `repository.deleteCoachesByFamilyId(familyId)`（T69で実装済みのCoach Repository）
  3. `repository.deleteFamilyMembersByFamilyId(familyId)`（T70で実装済みのFamilyMember Repository）
  4. `repository.deleteFamily(familyId)`（本タスクで実装したFamily Repositoryの単一ドキュメント削除）
- `familyService.ts`からFirestore SDK（`firebase/firestore`）のimportをすべて削除する

---

## 5. 実装範囲外（やらないこと）

- 他エンティティ（PickupLocation・Destination・Event等）のRepository実装（別タスク）
- コンポーネント・ページ・hooks側の呼び出し元コードの変更
  （`services/master/familyService.ts`を経由し続けるため対象外。
  docs/08_公開版アーキテクチャ設計.md#2参照）
- `deleteFamily`のカスケード対象・順序の変更（現状のロジックをそのまま踏襲する）
- `DexieRepository`の実装（対象外）

---

## 6. 受け入れ条件

- `familyService.ts`に`firebase/firestore`からのimportが存在しない
- `familyService.ts`の各関数のシグネチャ（引数・戻り値の型）が変更前と一致する
- 家庭を削除すると、所属する選手・コーチ・家族もこれまで通り道連れで削除される
- `npm run build`が成功する
- `npm run test:e2e`が変更前と同じ結果（既存のグリーンなテストがグリーンのまま）になる

---

## 7. 依存タスク

- T67 型定義変更・CarpoolRepositoryインターフェース定義
- T68 Player Repository実装（`deletePlayersByFamilyId`を使用）
- T69 Coach Repository実装（`deleteCoachesByFamilyId`を使用）
- T70 FamilyMember Repository実装（`deleteFamilyMembersByFamilyId`を使用）

---

## 提案（タスク対象外）

なし
