# tasks/task_T03_型定義_Event_Response_Carpool.md

# Task T03 型定義 Event・Response・Carpool

---

## 1. 対象設計書

ref:
- docs/05_データ設計.md#7 Event
- docs/05_データ設計.md#8 Response
- docs/05_データ設計.md#9 Carpool

---

## 2. このタスクのゴール

Event・Response・Carpoolのデータ構造をTypeScriptの型として定義し、
以降のFirestore実装や配車アルゴリズムで利用できる状態にする。

---

## 3. 変更対象ファイル（想定）

- `src/types/event.ts`

※プロジェクト構成に合わせて既存の型定義ファイルへ追加してもよい。

---

## 4. 実装範囲（やること）

### Event型を定義する

設計書「Event」に記載された全フィールドを定義する。

- id
- name
- date
- destinationId
- createdAt
- updatedAt

---

### Response型を定義する

設計書「Response」に記載された家庭情報を定義する。

- driverOutward
- driverReturn
- capacityToday
- coachParticipating
- remarks

---

### ResponseChild型を定義する

children配列の要素型として定義する。

- childId
- isParticipating
- noOutwardRide
- noReturnRide

---

### Carpool型を定義する

設計書「Carpool」に記載された全フィールドを定義する。

- id
- direction
- driverFamilyId
- driverIsCoach
- capacity
- routeOrder
- members

---

### Direction型を定義する

以下の値のみ許可する型を定義する。

- OUTWARD
- RETURN

---

### CarpoolMember型を定義する

以下のUnion型を定義する。

#### Child

- type
- childId

#### Coach

- type
- familyId

---

## 5. 実装範囲外（やらないこと・触らないこと）

以下は本タスクでは実装しない。

- Firestore CRUD
- Firestore Converter
- Repository
- Service
- バリデーション
- 配車アルゴリズム
- UI実装
- コレクションパス定義
- Timestamp生成処理

---

## 6. 受け入れ条件

- Event型が定義されている
- Response型が定義されている
- ResponseChild型が定義されている
- Carpool型が定義されている
- Direction型が定義されている
- CarpoolMember型がUnion型で定義されている
- 設計書に記載された項目が漏れなく型へ反映されている
- TypeScriptの型エラーが発生しない

---

## 7. 依存タスク

なし
