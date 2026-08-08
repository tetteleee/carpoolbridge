# Task T98 FamilyMember バックアップ復元メソッド追加

---

## 1. 対象設計書

ref:
- docs/12_データバックアップ機能設計.md#6 CarpoolRepositoryインターフェースの拡張
- docs/05_データ設計.md#5 FamilyMember

---

## 2. このタスクのゴール

バックアップの読み込みで、元のIDのまま家族データを書き込めるようにする
`restoreFamilyMember`メソッドを`CarpoolRepository`に追加し、Firestore・Dexie両方に
実装する。T95と同じパターンで実装する。既存の`createFamilyMember`には一切手を触れない。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/CarpoolRepository.ts`（`restoreFamilyMember`の型追加）
- `src/repositories/firestore/familyMemberRepository.ts`（実装追加）
- `src/repositories/dexie/familyMemberRepository.ts`（実装追加）

---

## 4. 実装範囲（やること）

- `CarpoolRepository`インターフェースに
  `restoreFamilyMember(familyMember: FamilyMember): Promise<void>;`を追加する
- `firestore/familyMemberRepository.ts`：`Pick<...>`に`'restoreFamilyMember'`を追加し、
  `setDoc(doc(db, firestorePaths.familyMemberDocument(familyMember.id)), { familyId, name,
  isActive, createdAt: Timestamp.fromDate(familyMember.createdAt),
  updatedAt: Timestamp.fromDate(familyMember.updatedAt) })`で実装する。`serverTimestamp()`は
  使わず、バックアップファイルの値をそのまま書き込む（T95参照）
- `dexie/familyMemberRepository.ts`：`Pick<...>`に`'restoreFamilyMember'`を追加し、
  `db.familyMembers.put({ ...familyMember })`で実装する

---

## 5. 実装範囲外（やらないこと）

- 他エンティティの`restore*`実装
- `clearAllData`・`backupService`（T102、T103）
- 既存`createFamilyMember`等、他メソッドの変更

---

## 6. 受け入れ条件

- `CarpoolRepository`に`restoreFamilyMember`が追加されている
- Firestore・Dexie両方に実装され、`repository.restoreFamilyMember`として呼び出せる
- `npm run build`が成功する
- `restoreFamilyMember`実行後、`getFamilyMembersByFamilyId(familyMember.familyId)`に
  渡した内容と同じ`FamilyMember`が含まれる

---

## 7. 依存タスク

- T97 Coach バックアップ復元メソッド追加（`CarpoolRepository.ts`への追記を直列で進める）

---

## 提案（タスク対象外）

なし
