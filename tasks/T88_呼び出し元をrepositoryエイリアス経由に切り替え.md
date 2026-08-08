# Task T88 呼び出し元を@repositoryエイリアス経由に切り替え

---

## 1. 対象設計書

ref:
- docs/10_DexieRepository実装設計.md#2 storageMode切り替え機構
- docs/10_DexieRepository実装設計.md#5 影響範囲・タスク分割方針（系統B）

---

## 2. このタスクのゴール

`services/`配下9ファイル・`carpoolMember.ts`が現在直接importしている
`repositories/firestore`を、T87で用意した`@repository`エイリアス経由に切り替える。
これにより、`storageMode`（ビルドmode）に応じてFirestore版・Dexie版が実際に
切り替わるようになる。

併せて、`repositories/firestore/index.ts`・`repositories/dexie/index.ts`の
公開型を`Partial<CarpoolRepository>`から`CarpoolRepository`（非Partial）へ変更する
（T77〜T86で全エンティティの実装が揃い、実際に完全な実装になっているため）。
これに伴い、各呼び出し元ファイルにあった`as CarpoolRepository`のキャストが不要になる。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/firestore/index.ts`（型をPartialから外す）
- `src/repositories/dexie/index.ts`（型をPartialから外す）
- `src/services/master/familyService.ts`
- `src/services/master/playerService.ts`
- `src/services/master/coachService.ts`
- `src/services/master/familyMemberService.ts`
- `src/services/master/pickupLocationService.ts`
- `src/services/master/destinationService.ts`
- `src/services/event/eventService.ts`
- `src/services/event/responseService.ts`
- `src/services/event/carpoolService.ts`
- `src/services/carpool/carpoolMember.ts`

※合計13ファイルとなりdocs/50_タスク作成ルール.mdの目安（1〜3ファイル）を超えるが、
すべて「importの参照元を1行変えるだけ」の機械的な変更であり、実質的な変更内容は
均一かつ小さい。T67〜T76・T77〜T86で確立したパターンの最後の配線作業のみのため、
1タスクにまとめる（T75の4ファイル超過時と同じ考え方）。

---

## 4. 実装範囲（やること）

- `repositories/firestore/index.ts`・`repositories/dexie/index.ts`の
  `export const firestoreRepository: Partial<CarpoolRepository> = {...}` /
  `export const dexieRepository: Partial<CarpoolRepository> = {...}`の型注釈から
  `Partial<>`を外し、`CarpoolRepository`型に変更する
  （全エンティティのスプレッドが揃っているため型エラーは出ないはずだが、
  もし漏れているメソッドがあればここで型エラーとして検出される。検出された場合は
  該当タスクの実装漏れとして扱い、報告する）
- 上記11ファイルそれぞれで、以下のパターンを置き換える。

  変更前（例: `playerService.ts`）:
  ```typescript
  import type { CarpoolRepository } from '../../repositories/CarpoolRepository';
  import { firestoreRepository } from '../../repositories/firestore';

  const repository = firestoreRepository as CarpoolRepository;
  ```

  変更後:
  ```typescript
  import { repository } from '@repository';
  ```

  （`carpoolMember.ts`も同様のパターンを持つため同じ置き換えを行う）

---

## 5. 実装範囲外（やらないこと）

- 各serviceファイルの関数本体のロジック変更（importの参照元切り替えのみ）
- コンポーネント・ページ・hooks側の変更（`services/`を経由し続けるため対象外）
- `DexieRepository`・`FirestoreRepository`の実装内容の変更（T68〜T76・T77〜T86で
  完了済み。型エラーで実装漏れが見つかった場合を除く）

---

## 6. 受け入れ条件

- `npm run build`（自チーム版）が成功する
- `npm run build:public`（公開版）が成功する
- `services/`配下・`carpoolMember.ts`のいずれにも`repositories/firestore`・
  `repositories/dexie`への直接importが存在しない（`@repository`経由のみ）
- `npm run build:public`のビルド成果物（`dist/`配下）に`firebase`パッケージ由来のコードが
  含まれていない（T87時点では呼び出し元が未切り替えのため残っていたが、本タスク完了後は
  除外される）
- `npm run build`（自チーム版）のビルド成果物に`dexie`パッケージ由来のコードが
  含まれていない
- `npm run test:e2e`が変更前と同じ結果になる（自チーム版・Firestore Emulator前提のテストが
  引き続きグリーンであることを確認する。公開版のE2E整備はdocs/10_DexieRepository実装設計.md#6の
  通り対象外）

---

## 7. 依存タスク

- T77〜T86（DexieRepositoryの全エンティティ実装）
- T87（storageMode切り替え配線）

---

## 提案（タスク対象外）

なし
