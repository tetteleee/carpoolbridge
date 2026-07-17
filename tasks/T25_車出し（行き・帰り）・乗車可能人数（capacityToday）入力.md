# Task T25 車出し（行き／帰り）・乗車可能人数（capacityToday）入力

---

## 1. 対象設計書

ref:
- docs/04_画面設計.md#7 イベント編集 回答入力
- docs/05_データ設計.md#8 Response（イベント回答） capacityToday

---

## 2. このタスクのゴール

T24で用意された家庭カード内の表示領域に、家庭単位の「車出し（行き）」「車出し（帰り）」「乗車可能人数（capacityToday）」の入力UIと状態管理を実装する。

---

## 3. 変更対象ファイル（想定）

- `src/components/eventEdit/FamilyResponseCard.tsx`
- `src/components/eventEdit/DriverAndCapacitySection.tsx`

※ファイル構成はプロジェクト構成に合わせて読み替えてよい。

---

## 4. 実装範囲（やること）

### 車出し（行き／帰り）

- 「車出し（行き）」に `[可][不可]` の2択ボタンを表示し、`driverOutward`（Boolean）として保持する
- 「車出し（帰り）」に `[可][不可]` の2択ボタンを表示し、`driverReturn`（Boolean）として保持する

### 乗車可能人数（capacityToday）

- 乗車可能人数の入力欄を表示し、`capacityToday`（Number \| null）として保持する
- 未変更（`capacityToday = null`）の場合は、対象家庭の`Family.vehicleCapacity`の値を初期値として薄字のプレースホルダー表示する
- 値が変更された場合は、通常字＋アイコン等で「変更済み」であることが分かる表示に切り替える

### 初期値の反映

- T24で取得済みの対象イベント・対象家庭のResponse（存在する場合）から、`driverOutward`・`driverReturn`・`capacityToday`の値を初期値として反映する

---

## 5. 実装範囲外（やらないこと）

- 子供ごとの参加・行き不要・帰り不要トグル（T26で実施）
- コーチ参加回答（T27で実施）
- 備考の入力処理（T28で実施）
- 入力内容のFirestoreへの自動保存処理そのもの（T29で実施。本タスクではUI・状態管理までを対象とし、保存トリガーの配線は行わない）
- 家庭カード全体のレイアウト・データ取得（T24で実施済み）
- 未回答家庭（対象Responseドキュメントが存在しない場合）における`driverOutward`・`driverReturn`の初期表示ルール（対象設計書に規定がないため、本タスクでは規定しない）

---

## 6. 受け入れ条件

- 「車出し（行き）」の `[可][不可]` を選択できる
- 「車出し（帰り）」の `[可][不可]` を選択できる
- 乗車可能人数を入力できる
- 乗車可能人数が未変更（`capacityToday = null`）の場合、`Family.vehicleCapacity`の値が薄字のプレースホルダーとして表示される
- 乗車可能人数が変更された場合、通常字＋変更済みであることが分かる表示になる
- 対象家庭に既存の回答（Response）が存在する場合、`driverOutward`・`driverReturn`・`capacityToday`の値が初期表示に反映される
- 入力内容の実際のFirestoreへの保存（自動保存）は行っていない（T29の範囲）

---

## 7. 依存タスク

- T24 家庭カード一覧のレイアウト・データ取得

---

## 提案（タスク対象外）

なし
