# Task T103 backupService実装

---

## 1. 対象設計書

ref:
- docs/12_データバックアップ機能設計.md#4 バックアップファイルの形式
- docs/12_データバックアップ機能設計.md#5 インポート時の処理方針（全置換）
- docs/12_データバックアップ機能設計.md#7 ビジネスロジック層

---

## 2. このタスクのゴール

`services/backup/backupService.ts`（新規）に、バックアップの書き出し・読み込みを行う
ストレージ非依存の関数`exportAllData`・`importAllData`を実装する。
`08_公開版アーキテクチャ設計.md`7章の方針（カスケード処理はRepositoryに含めず
service層に置く）に従い、Repositoryのプリミティブ（T95〜T102で実装済み）を
組み合わせるだけの実装とする。

---

## 3. 変更対象ファイル（想定）

- `src/services/backup/backupService.ts`（新規）
- `src/types/backup.ts`（新規。`BackupData`型定義）

---

## 4. 実装範囲（やること）

### `BackupData`型（`types/backup.ts`）

docs/12_データバックアップ機能設計.md#4のトップレベル構造をそのまま型定義する
（`schemaVersion: 1`・`exportedAt: string`・`pickupLocations`・`destinations`・
`families`・`players`・`coaches`・`familyMembers`・`events`（各要素に
`responses: ResponseWithFamilyId[]`・`carpools: Carpool[]`を埋め込んだ配列））。

### `exportAllData(): Promise<BackupData>`

1. `getPickupLocations`・`getDestinations`・`getFamilies`・`getAllPlayers`・
   `getAllCoaches`・`getAllFamilyMembers`を呼ぶ
2. `getUpcomingEvents(today)`と、`getPastEventsPage`を`hasMore`が`false`になるまで
   カーソルを進めながらループして、全イベント（過去＋今後）を集める
   （`today`は呼び出し時点の日付を`YYYY-MM-DD`形式で渡す）
3. 各イベントについて`getResponses(eventId)`・`getCarpools(eventId)`（方向指定なし＝
   両方向）を呼び、`{ ...event, responses, carpools }`の形にする
4. `schemaVersion: 1`・`exportedAt: new Date().toISOString()`とあわせて`BackupData`を
   組み立てて返す

### `importAllData(data: BackupData): Promise<void>`

1. `data.schemaVersion !== 1`の場合はエラーを投げる（呼び出し元のUIでエラー表示する。
   `04_画面設計.md#10.5`「このファイルは読み込めません」）
2. `repository.clearAllData()`を呼ぶ
3. `docs/12_データバックアップ機能設計.md#5`の順で、`pickupLocations`→`destinations`→
   `families`→`players`→`coaches`→`familyMembers`の各配列を`restore*`メソッドで
   1件ずつ書き込む
4. `events`配列の各要素について、まず`restoreEvent`でイベント本体を書き込み、続けて
   `responses`配列の各要素を`createResponse(eventId, familyId, response)`で、
   `carpools`配列を`saveCarpools(eventId, carpools)`で書き込む

---

## 5. 実装範囲外（やらないこと）

- JSONファイルの読み書き（`File`オブジェクトの読み込み、ダウンロードとしての保存）は
  UI層（T105、`データのバックアップ画面`）の責務とする。本タスクは
  パース済み・型が揃った`BackupData`オブジェクトを受け取る関数のみ実装する
- Firestore Timestamp⇔Date変換（各Repositoryの`restore*`実装内で完結済み。T95〜T101）
- UIの確認ダイアログ・エラー表示（T105）

---

## 6. 受け入れ条件

- `exportAllData()`を実行すると、登録済みの全マスタ・全イベント（過去分を含む）・
  回答・配車結果を含む`BackupData`が返る
- `exportAllData()`で得た`BackupData`を`importAllData()`に渡すと、`clearAllData`実行後の
  空の状態から元と同じデータが復元される（往復一致）
- `schemaVersion`が1以外の場合、`importAllData()`はデータを一切変更せずエラーを投げる
- `npm run build`が成功する

---

## 7. 依存タスク

- T102 clearAllData実装

---

## 提案（タスク対象外）

なし
