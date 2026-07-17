# Task T12 Child_CRUD処理（家庭無効化時の連動無効化）

---

## 1. 対象設計書

ref:
- docs/05_データ設計.md#4 Child（子供）
- docs/03_ユースケース.md#UC-07 家庭情報を登録・編集・削除する
- docs/05_データ設計.md#11 削除方針

---

## 2. ゴール

子供（Child）マスタデータに対する登録・取得・更新・論理削除処理を実装する。あわせて、家庭（Family）が無効化された際、その家庭に属する子供を自動で無効化する処理を実装する。

---

## 3. 変更対象ファイル（想定）

- src/services/master/childService.ts
- src/services/master/familyService.ts（家庭無効化時に子供側の連動処理を呼び出す配線を追加）

※ファイル構成はプロジェクト構成に合わせて読み替えてよい。

---

## 4. 実装範囲

- `children` コレクションへの新規登録処理
- 指定familyIdに紐づく子供一覧の取得処理
- 既存ドキュメント（name・schoolEntryYear・pickupLocationOverride）の更新処理
- 個別の子供に対する論理削除処理（isActiveをfalseに更新。ドキュメントは物理削除しない）
- 指定familyIdに紐づく全ての子供のisActiveを一括でfalseに更新する処理
- 上記の一括無効化処理を、Family側の論理削除処理（T11、isActiveをfalseにする更新）から呼び出す配線

---

## 5. 実装範囲外

- UI実装（T16で実施）
- 家庭を再度有効化（isActive=trueに復帰）した場合の子供側の連動処理
  - 設計書（05_データ設計.md#4,#11）には「家庭を無効化したら子供も自動で無効化する」という記載のみで、再有効化時の連動については記載がないため対象外とする
- サンプルデータ投入機能（T17）
- 物理削除処理

---

## 6. 受け入れ条件

- `children` コレクションへ新規ドキュメントを登録できる
- 指定familyIdに紐づく子供一覧を取得できる
- name・schoolEntryYear・pickupLocationOverrideを更新できる
- 個別の子供を論理削除できる（isActive=falseとなり、ドキュメントは残る）
- 家庭をT11の更新処理でisActive=falseにすると、その家庭に属する全ての子供のisActiveが自動でfalseになる
- 物理削除処理を実装していない

---

## 7. 依存タスク

- T11 Family_CRUD処理（isActive論理削除）

---

## 提案（タスク対象外）

なし
