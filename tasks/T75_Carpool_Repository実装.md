# Task T75 Carpool Repository実装

---

## 1. 対象設計書

ref:
- docs/08_公開版アーキテクチャ設計.md#5 CarpoolRepositoryインターフェース（Carpoolセクション、ファイル構成）
- docs/08_公開版アーキテクチャ設計.md#6 saveCarpoolsの新設について
- docs/08_公開版アーキテクチャ設計.md#7 Repositoryに含めない処理（`carpoolService.deleteCarpoolsByDirection`）
- docs/05_データ設計.md#9,#10 Carpool

---

## 2. このタスクのゴール

`services/event/carpoolService.ts`が直接呼んでいるFirestore SDKの呼び出しを、
`src/repositories/firestore/carpoolRepository.ts`（新規）へ移す。新設メソッド
`saveCarpools`（upsertのみ。docs/08_公開版アーキテクチャ設計.md#6参照）を実装し、
`carpoolMember.ts`の`moveCarpoolMember`を`writeBatch`直呼びから
`repository.saveCarpools`経由に書き換える。`carpoolService.ts`の`deleteCarpoolsByDirection`
（同一エンティティ内で完結するカスケード）はRepositoryプリミティブ呼び出しに書き換える。
コンポーネント側の呼び出し元は一切変更しない。

---

## 3. 変更対象ファイル（想定）

- `src/repositories/firestore/carpoolRepository.ts`（新規）
- `src/repositories/firestore/index.ts`（`carpoolRepository`の内容をマージ）
- `src/services/event/carpoolService.ts`（内部実装をRepository呼び出しへ置き換え）
- `src/services/carpool/carpoolMember.ts`（`moveCarpoolMember`を`repository.saveCarpools`経由に書き換え）

※4ファイルとなり docs/50_タスク作成ルール.md の目安（1〜3ファイル）をやや超えるが、
`saveCarpools`とその唯一の呼び出し元である`moveCarpoolMember`は安全性（6章参照）が
密接に結びついており、分割すると中間状態でこの安全性が壊れうるため1タスクにまとめる。

---

## 4. 実装範囲（やること）

- `carpoolRepository.ts`に、`CarpoolRepository`インターフェースのCarpool部分
  （`createCarpool`・`getCarpools`・`getCarpool`・`updateCarpool`・`deleteAllCarpools`・
  `deleteCarpool`）を実装する。実装内容は現在`carpoolService.ts`にあるFirestore SDK
  呼び出しをそのまま移植する（ロジック自体は変更しない）
- `carpoolRepository.ts`に新設メソッド`saveCarpools(eventId, carpools: Carpool[])`を実装する。
  渡された配列の各要素を`writeBatch`で一括create/update（upsert）するのみとし、
  そのイベントの他のCarpoolドキュメントには一切手を触れない（docs/08_公開版アーキテクチャ設計.md#6参照）
- `firestore/index.ts`に`carpoolRepository`の内容をマージし、`FirestoreRepository`
  オブジェクトの一部として公開する
- `carpoolService.ts`の`createCarpool`・`getCarpools`・`getCarpool`・`updateCarpool`・
  `deleteAllCarpools`・`deleteCarpool`を、対応する`repository.xxx(...)`への1行委譲に書き換える
- `carpoolService.ts`の`deleteCarpoolsByDirection`（カスケード関数）は関数として残すが、
  内部実装を`repository.getCarpools(eventId, direction)`→ループで`repository.deleteCarpool(...)`
  を呼ぶ形に書き換える（ロジック自体は不変）
- `carpoolService.ts`からFirestore SDK（`firebase/firestore`）のimportをすべて削除する
- `carpoolMember.ts`の`moveCarpoolMember`を、`doc`・`writeBatch`の直接呼び出しから
  `repository.saveCarpools(eventId, [更新後のCarpool一覧])`を呼ぶ形に書き換える。
  移動元・移動先のうち、実際に更新が発生した方（1件または2件）のみを配列に含める
  （未配車エリアが移動元・移動先の場合はそちらのCarpoolドキュメントは存在しないため対象外、
  という現行仕様は変更しない）

---

## 5. 実装範囲外（やらないこと）

- 他エンティティ（Event等）のRepository実装（別タスク）
- `eventService.deleteEvent`のカスケードを`repository.deleteAllCarpools`経由に
  書き換える作業（T76 Eventタスクで実施）
- コンポーネント・ページ・hooks側の呼び出し元コードの変更
  （`services/event/carpoolService.ts`を経由し続けるため対象外。
  docs/08_公開版アーキテクチャ設計.md#2参照）
- `DexieRepository`の実装（対象外）

---

## 6. 受け入れ条件

- `carpoolService.ts`・`carpoolMember.ts`に`firebase/firestore`からのimportが存在しない
  （`carpoolMember.ts`は`repository`経由のみになる）
- `carpoolService.ts`の各関数のシグネチャ（引数・戻り値の型）が変更前と一致する
- 配車結果画面でのドラッグ&ドロップ（未配車⇔車カード・車カード⇔車カード）が
  これまで通り正しく動作する（移動元・移動先の更新が同時に成功・同時に失敗する）
- `npm run build`が成功する
- `npm run test:e2e`が変更前と同じ結果（既存のグリーンなテストがグリーンのまま）になる

---

## 7. 依存タスク

- T67 型定義変更・CarpoolRepositoryインターフェース定義

---

## 提案（タスク対象外）

なし
