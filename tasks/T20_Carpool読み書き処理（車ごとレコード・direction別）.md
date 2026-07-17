# Task T20 Carpool読み書き処理（車ごとレコード・direction別）

---

## 1. 対象設計書

ref:
- docs/05_データ設計.md#9 Carpool（配車結果）

---

## 2. ゴール

イベント配下に保存される車ごとの配車結果（Carpool）に対する登録・取得・更新処理を実装し、direction（"OUTWARD"／"RETURN"）別に扱えるようにする。

---

## 3. 変更対象ファイル（想定）

- src/services/event/carpoolService.ts

※ファイル構成はプロジェクト構成に合わせて読み替えてよい。

---

## 4. 実装範囲

- `events/{eventId}/carpools/{carpoolId}` への新規登録処理
  - direction（"OUTWARD"｜"RETURN"）・driverFamilyId・driverIsCoach・capacity・routeOrder[]・members[]
  - members[]は`{ type: "child", childId }`または`{ type: "coach", familyId }`の2種のみとする
- 指定eventId配下のCarpool一覧取得処理（directionを指定した絞り込み取得を含む）
- 指定eventId・carpoolIdの単一Carpool取得処理
- 既存Carpoolドキュメントに対する更新処理（driverFamilyId・driverIsCoach・capacity・routeOrder・membersを更新可能とする）
- Firestoreコレクションパス定数（T04）を利用して `events/{eventId}/carpools/{carpoolId}` のパスを参照する
- `carName`・`driverName`はドキュメントに保持しない（表示名は都度Familyから生成する設計のため）

---

## 5. 実装範囲外

- 配車アルゴリズム自体（距離計算・割当ロジック等。T32〜T37で実施）
- Response→Carpool生成処理・Firestoreへの保存を含む統合関数（T37で実施）
- 配車再作成時の既存Carpoolデータの削除・入れ替えロジック（対象設計書#9に削除に関する記載がなく、統合処理の一部としてT37の範囲となるため本タスクでは扱わない）
- UI実装（配車画面。T38以降で実施）
- Event・Response自体のCRUD（T18・T19で実施済み）

---

## 6. 受け入れ条件

- `events/{eventId}/carpools/{carpoolId}` へ新規Carpoolドキュメントを登録できる
- 指定eventId配下のCarpool一覧を取得できる
- directionを指定してCarpoolを絞り込み取得できる
- 指定eventId・carpoolIdのCarpoolを単体取得できる
- 既存Carpoolドキュメントの内容（driverFamilyId・driverIsCoach・capacity・routeOrder・members）を更新できる
- `carName`・`driverName`をドキュメントに保持していない
- コレクションパスをハードコードしていない
- UIに依存しないサービス層として利用できる

---

## 7. 依存タスク

- T18 Event_CRUD処理

---

## 提案（タスク対象外）

なし
