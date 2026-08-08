# Task T80 FamilyMember DexieRepository実装

---

## 1. 対象設計書

ref:
- docs/10_DexieRepository実装設計.md#3 ID生成方式
- docs/10_DexieRepository実装設計.md#4 Dexieスキーマ設計
- docs/08_公開版アーキテクチャ設計.md#5 CarpoolRepositoryインターフェース（FamilyMemberセクション）

---

## 2. このタスクのゴール

`CarpoolRepository`インターフェースのFamilyMember部分を、
`src/repositories/dexie/familyMemberRepository.ts`（新規）にDexie（IndexedDB）版として
実装する。T70（Firestore版）と同じメソッド構成・シグネチャで実装し、`dexie/index.ts`へ
マージする。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/dexie/familyMemberRepository.ts`（新規）
- `src/repositories/dexie/index.ts`（`familyMemberRepository`の内容をマージ）

---

## 4. 実装範囲（やること）

`db.familyMembers`（T77で定義済み）に対して、以下を実装する。Player・Coachと全く同型の構造。

- `createFamilyMember(data)`: `crypto.randomUUID()`でid発行、`isActive: true`・
  `createdAt`/`updatedAt`に`new Date()`を付与して`db.familyMembers.add(...)`。idを返す
- `getFamilyMembersByFamilyId(familyId)`: `db.familyMembers.where('familyId').equals(familyId).toArray()`
- `getAllFamilyMembers()`: `db.familyMembers.toArray()`
- `updateFamilyMember(familyMemberId, data)`: `updatedAt: new Date()`を付与して
  `db.familyMembers.update(familyMemberId, ...)`
- `deleteFamilyMember(familyMemberId)`: `db.familyMembers.delete(familyMemberId)`
- `deleteFamilyMembersByFamilyId(familyId)`: `db.familyMembers.where('familyId').equals(familyId).delete()`

`familyMemberRepository`を`Pick<CarpoolRepository, 'createFamilyMember' | ...>`型でexportし、
`dexie/index.ts`へスプレッドでマージする。

---

## 5. 実装範囲外（やらないこと）

- 他エンティティのDexieRepository実装（別タスク）
- `services/master/familyMemberService.ts`の変更（T88で一括対応）
- FirestoreRepository側の実装変更（T70で完了済み、対象外）

---

## 6. 受け入れ条件

- `dexie/index.ts`が`familyMemberRepository`をマージした状態でビルドが通る
- `npm run build`が成功する
- 各メソッドのシグネチャが`CarpoolRepository`インターフェース・T70のFirestore版と一致する

---

## 7. 依存タスク

- T77 Dexie基盤（db.ts全テーブル定義・dexie/index.tsの空の器）

---

## 提案（タスク対象外）

なし
