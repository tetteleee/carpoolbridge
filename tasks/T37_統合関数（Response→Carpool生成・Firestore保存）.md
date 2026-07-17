# Task T37 統合関数（Response→Carpool生成・Firestore保存）

---

## 1. 対象設計書

ref:
- docs/07_配車アルゴリズム.md（全体）
- docs/05_データ設計.md#9 Carpool（配車結果）
- docs/05_データ設計.md#8 Response（イベント回答）（Group変換元データの参照用）

---

## 2. ゴール

指定イベント・指定方向（行き／帰り）のResponseデータを入力として、前処理（T33・T34）→割当（T35）→例外系ハンドリング（T36）の一連の配車アルゴリズムを実行し、その結果を05_データ設計.md#9のCarpoolドキュメント形式に変換したうえでFirestoreへ保存する統合関数を実装する。

---

## 3. 変更対象ファイル（想定）

- src/services/carpool/runCarpoolAssignment.ts

※ファイル構成はプロジェクト構成に合わせて読み替えてよい。
※Service層の集計・生成処理とFirestore永続化処理が1ファイルに収まらない場合は、関連するファイルに分割してよい（「9. 提案」参照）。

---

## 4. 実装範囲

- 指定`eventId`・`direction`（`OUTWARD`｜`RETURN`）に対応するデータの取得
  - T19のResponse読み書き処理を用いて、対象イベント配下のResponse一覧を取得する
  - 取得したResponseおよびFamily・Child等のマスタ情報をもとに、前処理フェーズ（T33・T34）が要求する入力形式（車両配列・グループ配列）へ変換する
- 前処理（T33・T34）→割当（T35）→例外系ハンドリング（T36）の一連の呼び出し
- 割当結果（`assignedVehicles`）を、05_データ設計.md#9のCarpoolドキュメント形式へ変換する処理
  - `direction`・`driverFamilyId`・`driverIsCoach`・`capacity`・`routeOrder[]`・`members[]`を生成する
  - `members[]`は`{ type: "child", childId }`または`{ type: "coach", familyId }`の2種のみとし、05_データ設計.md#9の判定基準（child: 対象方向の`noOutwardRide`/`noReturnRide`が`false`かつ`isParticipating`が`true`の子供、coach: `coachParticipating`が`true`かつ対象方向の車出しが不可の場合のみ）に従って生成する
  - `carName`・`driverName`はドキュメントに含めない
- T20のCarpool読み書き処理を用いて、変換したCarpoolドキュメントをFirestoreへ保存する処理
- T36で検出されたHard Failエラーが存在する場合は、Firestoreへの保存を行わずにエラー結果を呼び出し元へ返す処理
- T36で生成された警告（配車枠不足・未回答者ありなど）が存在する場合は、保存自体は実行したうえで、警告情報を呼び出し元へあわせて返す処理

---

## 5. 実装範囲外

- 前処理フェーズ自体のロジック（緯度経度バリデーション・車両有効定員初期化・家族グループ形成・ドライバー優先割当バリデーション。T33・T34で実施）
- 割当フェーズの貪欲法ロジック自体（T35で実施）
- 例外系エラー・警告メッセージの生成ロジック自体（T36で実施）
- Carpoolドキュメントの個別CRUD処理自体（T20で実施済み）
- Response・Event・Familyなど参照元データのCRUD処理自体（T18・T19で実施済み。マスタ系はT09〜T12で実施済み）
- 配車再作成時の既存Carpoolデータの削除・入れ替えロジック（05_データ設計.md#9に削除に関する記載がなく、対象外とする。関連する確認ダイアログUIはT30で実施済み）
- UI実装（配車画面。T38以降で実施）

---

## 6. 受け入れ条件

- 指定`eventId`・`direction`を指定して統合関数を呼び出すと、対象方向のResponseから未配車グループ・車両情報が構築され、前処理→割当→例外系ハンドリングの一連の処理が実行される
- 割当結果が05_データ設計.md#9のCarpoolドキュメント形式（`direction`・`driverFamilyId`・`driverIsCoach`・`capacity`・`routeOrder[]`・`members[]`）に変換される
- `members[]`が`{ type: "child", childId }`または`{ type: "coach", familyId }`のみで構成され、`carName`・`driverName`を含まない
- 変換されたCarpoolドキュメントが、T20の書き込み処理を通じてFirestoreへ保存される
- 緯度経度未登録・優先割当定員超過などのHard Failエラーが検出された場合、Firestoreへの保存が行われず、エラー内容を含む結果が返る
- `unassignedList`が発生する（配車枠が不足する）場合でも、割当済みの結果についてはFirestoreへの保存が行われ、警告情報とあわせて結果が返る
- 未回答家庭が存在する場合、当該家庭は配車対象から除外されたうえで処理が完了し、未回答者数を含む警告情報が結果に含まれる

---

## 7. 依存タスク

- T36 例外系ハンドリング（unassignedList・エラーメッセージ）
- T20 Carpool読み書き処理（車ごとレコード・direction別）
- T19 Response読み書き処理（family単位ドキュメント・未回答判定）

---

## 提案（タスク対象外）

バックログの「粒度に関する所感」に記載の通り、本タスクはResponse等の取得・アルゴリズム呼び出し・Carpool形式への変換・Firestore書き込みを含むため、実装対象が3ファイルを超える可能性がある。実装時に肥大化が大きいと判断される場合は、「純粋な集計・生成処理（Response→Carpoolデータへの変換）」と「Firestoreへの永続化処理」を別タスク（別PR）に分割することを検討する余地がある。ただし、本タスクファイルはバックログ記載の粒度（T37として1タスク）をそのまま前提としており、分割の要否・粒度の再定義は本タスクの範囲外の判断とする。
