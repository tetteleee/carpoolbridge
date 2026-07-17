# Task T11 Family_CRUD処理（isActive論理削除）

---

## 1. 対象設計書

ref:
- docs/05_データ設計.md#3 Family（家庭）
- docs/03_ユースケース.md#UC-07 家庭情報を登録・編集・削除する
- docs/05_データ設計.md#11 削除方針

---

## 2. ゴール

家庭（Family）マスタデータに対する登録・取得・更新処理を実装する。「削除」は物理削除ではなく、isActiveフラグによる論理削除（在籍中トグルのOFF、および再度ONに戻す操作）で実現する。

---

## 3. 変更対象ファイル（想定）

- src/services/master/familyService.ts

※ファイル構成はプロジェクト構成に合わせて読み替えてよい。

---

## 4. 実装範囲

- `families` コレクションへの新規登録処理（isActive=trueで作成し、createdAt・updatedAtを設定する）
- `families` コレクションからの一覧取得処理
- `families` コレクションからの単一取得処理
- 既存ドキュメントの更新処理（familyName・coachName・vehicleCapacity・pickupLocationId・isActiveを更新可能とし、updatedAtを更新する）
  - isActiveの更新（true→false、false→trueの双方向）もこの更新処理でカバーする
- Firestoreコレクションパス定数（T04）を利用して参照する

---

## 5. 実装範囲外

- 家庭無効化時の子供（Child）への連動無効化処理（T12で実施）
- UI実装（T15で実施）
- Firestore Security Rules変更
- サンプルデータ投入機能（T17）
- 物理削除処理

---

## 6. 受け入れ条件

- `families` コレクションへ新規ドキュメントを登録できる（isActive=trueで作成される）
- 登録済みの家庭一覧を取得できる
- familyName・coachName・vehicleCapacity・pickupLocationIdを更新できる
- isActiveをfalseに更新（論理削除）できる。ドキュメントは削除されず残る
- isActiveをtrueに戻す（再登録・在籍復帰）更新もできる
- 物理削除処理を実装していない
- コレクションパスをハードコードしていない

---

## 7. 依存タスク

- T04 Firestoreコレクションパス定数定義

---

## 提案（タスク対象外）

なし
