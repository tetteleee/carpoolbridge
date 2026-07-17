# Task T19 Response読み書き処理（family単位ドキュメント・未回答判定）

---

## 1. 対象設計書

ref:
- docs/05_データ設計.md#8 Response（イベント回答）
- docs/03_ユースケース.md#UC-02 項目を入力する
- docs/03_ユースケース.md#UC-03 回答を修正する

---

## 2. ゴール

イベント配下に保存される家庭単位の回答（Response）に対する登録・取得・更新処理を実装し、家庭ごとの回答内容および「未回答」判定を扱えるようにする。

---

## 3. 変更対象ファイル（想定）

- src/services/event/responseService.ts

※ファイル構成はプロジェクト構成に合わせて読み替えてよい。

---

## 4. 実装範囲

- `events/{eventId}/responses/{familyId}` への回答の新規登録処理
  - ドキュメントIDをfamilyIdとする
  - 家庭情報: driverOutward・driverReturn・capacityToday・coachParticipating・remarks
  - 子供情報: children[]（childId・isParticipating・noOutwardRide・noReturnRide）
- `events/{eventId}/responses/{familyId}` の既存ドキュメントに対する更新処理（UC-03 回答を修正する に対応）
- 指定eventId配下の回答一覧取得処理
- 指定eventId・familyIdの単一回答取得処理
- 「未回答」判定処理: 対象家庭のResponseドキュメントが存在するかどうかで判定する
  - 設計上statusフィールドは持たないため、ドキュメントの存在有無のみで判定する
- Firestoreコレクションパス定数（T04）を利用して `events/{eventId}/responses/{familyId}` のパスを参照する

---

## 5. 実装範囲外

- UI実装（イベント編集・回答入力画面。T24以降で実施）
- Event自体のCRUD（T18で実施済み）
- Family・Childのマスタ情報取得・整合性チェック（T11・T12で実施済みのCRUDをそのまま利用する想定とし、本タスクでは呼び出さない）
- 自動保存処理のトリガー・UI連携（T29で実施）
- `coachParticipating` の入力可否判定（`Family.coachName` が空かどうかの判定は呼び出し側の責務とし、本タスクでは受け取った値をそのまま保存・取得する）
- 配車アルゴリズムでの利用・Carpool生成（T32以降・T37で実施）
- Responseの削除処理（対象設計書に削除に関する記載がないため対象外とする）

---

## 6. 受け入れ条件

- `events/{eventId}/responses/{familyId}` へ新規回答を登録できる（ドキュメントIDがfamilyIdとなる）
- 既存の回答ドキュメントを更新できる（driverOutward・driverReturn・capacityToday・coachParticipating・remarks・children[]）
- 指定eventId配下の回答一覧を取得できる
- 指定eventId・familyIdのResponseドキュメントが存在するかどうかで「未回答」を判定できる
- コレクションパスをハードコードしていない
- UIに依存しないサービス層として利用できる

---

## 7. 依存タスク

- T18 Event_CRUD処理
- T11 Family_CRUD処理（isActive論理削除）
- T12 Child_CRUD処理（家庭無効化時の連動無効化）

---

## 提案（タスク対象外）

なし
