# Task T12 Player_CRUD処理（家庭無効化時の連動無効化）

---

## 1. 対象設計書

ref:
- docs/05_データ設計.md#4 Player（選手）
- docs/03_ユースケース.md#UC-07 家庭情報を登録・編集・削除する
- docs/05_データ設計.md#11 削除方針

---

## 2. ゴール

選手（Player）マスタデータに対する登録・取得・更新・論理削除処理を実装する。あわせて、家庭（Family）が無効化された際、その家庭に属する選手を自動で無効化する処理を実装する。

---

## 3. 変更対象ファイル（想定）

- src/services/master/playerService.ts
- src/services/master/familyService.ts（家庭無効化時に選手側の連動処理を呼び出す配線を追加）

※ファイル構成はプロジェクト構成に合わせて読み替えてよい。

---

## 4. 実装範囲

- `players` コレクションへの新規登録処理
- 指定familyIdに紐づく選手一覧の取得処理
- 既存ドキュメント（name・schoolEntryYear・pickupLocationOverride）の更新処理
- 個別の選手に対する論理削除処理（isActiveをfalseに更新。ドキュメントは物理削除しない）
- 指定familyIdに紐づく全ての選手のisActiveを一括でfalseに更新する処理
- 上記の一括無効化処理を、Family側の論理削除処理（T11、isActiveをfalseにする更新）から呼び出す配線

---

## 5. 実装範囲外

- UI実装（T16で実施）
- 家庭を再度有効化（isActive=trueに復帰）した場合の選手側の連動処理
  - 設計書（05_データ設計.md#4,#11）には「家庭を無効化したら選手も自動で無効化する」という記載のみで、再有効化時の連動については記載がないため対象外とする
- サンプルデータ投入機能（T17）
- 物理削除処理

---

## 6. 受け入れ条件

- `players` コレクションへ新規ドキュメントを登録できる
- 指定familyIdに紐づく選手一覧を取得できる
- name・schoolEntryYear・pickupLocationOverrideを更新できる
- 個別の選手を論理削除できる（isActive=falseとなり、ドキュメントは残る）
- 家庭をT11の更新処理でisActive=falseにすると、その家庭に属する全ての選手のisActiveが自動でfalseになる
- 物理削除処理を実装していない

---

## 7. 依存タスク

- T11 Family_CRUD処理（isActive論理削除）

---

## 提案（タスク対象外）

なし
