# Task T81 Family DexieRepository実装

---

## 1. 対象設計書

ref:
- docs/10_DexieRepository実装設計.md#3 ID生成方式
- docs/10_DexieRepository実装設計.md#4 Dexieスキーマ設計
- docs/08_公開版アーキテクチャ設計.md#5,#7 CarpoolRepositoryインターフェース（Familyセクション）・
  Repositoryに含めない処理

---

## 2. このタスクのゴール

`CarpoolRepository`インターフェースのFamily部分を、`src/repositories/dexie/familyRepository.ts`
（新規）にDexie（IndexedDB）版として実装する。T71（Firestore版）と同様、単一ドキュメント
（レコード）のCRUDのみを実装し、`deleteFamily`のカスケード削除（選手・コーチ・家族の
道連れ削除）は実装しない（`services/master/familyService.ts`側で既にストレージ非依存な
形で実装済みのため、Dexie側で新たに書く必要はない。docs/08_公開版アーキテクチャ設計.md#7参照）。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/dexie/familyRepository.ts`（新規）
- `src/repositories/dexie/index.ts`（`familyRepository`の内容をマージ）

---

## 4. 実装範囲（やること）

`db.families`（T77で定義済み）に対して、以下を実装する。

- `createFamily(data)`: `crypto.randomUUID()`でid発行、`isActive: true`・
  `createdAt`/`updatedAt`に`new Date()`を付与して`db.families.add(...)`。idを返す
- `getFamilies()`: `db.families.toArray()`
- `getFamily(familyId)`: `db.families.get(familyId)`。存在しない場合は`null`を返す
  （Dexieの`get`は見つからない場合`undefined`を返すため、`?? null`で変換する）
- `updateFamily(familyId, data)`: `updatedAt: new Date()`を付与して`db.families.update(familyId, ...)`
- `deleteFamily(familyId)`: 単一レコードの削除のみ。`db.families.delete(familyId)`
  （選手・コーチ・家族の道連れ削除は行わない。3章の通り、これは
  `services/master/familyService.ts`の`deleteFamily`が`repository.deletePlayersByFamilyId`等を
  順に呼ぶことで実現しており、Dexie側もT78〜T80で実装済みのプリミティブがそのまま使われる）

`familyRepository`を`Pick<CarpoolRepository, 'createFamily' | 'getFamilies' | 'getFamily' |
'updateFamily' | 'deleteFamily'>`型でexportし、`dexie/index.ts`へスプレッドでマージする。

---

## 5. 実装範囲外（やらないこと）

- `deleteFamily`のカスケード処理（選手・コーチ・家族の道連れ削除）の実装
  （`services/master/familyService.ts`側で既に完結しており、本タスクでは何もしない）
- 他エンティティのDexieRepository実装（別タスク）
- `services/master/familyService.ts`の変更（T88で一括対応）
- FirestoreRepository側の実装変更（T71で完了済み、対象外）

---

## 6. 受け入れ条件

- `dexie/index.ts`が`familyRepository`をマージした状態でビルドが通る
- `npm run build`が成功する
- 各メソッドのシグネチャが`CarpoolRepository`インターフェース・T71のFirestore版と一致する

---

## 7. 依存タスク

- T77 Dexie基盤（db.ts全テーブル定義・dexie/index.tsの空の器）
- T78 Player DexieRepository実装（`deletePlayersByFamilyId`が揃っている前提での動作確認用）
- T79 Coach DexieRepository実装（同上）
- T80 FamilyMember DexieRepository実装（同上）

---

## 提案（タスク対象外）

なし
