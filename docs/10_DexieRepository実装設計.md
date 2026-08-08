# 1. 目的・位置づけ

本ドキュメントは、`docs/08_公開版アーキテクチャ設計.md`で対象外としていた
`DexieRepository`本体の実装と`storageMode`切り替え機構を対象とする設計書である。

`docs/08`で確定した`CarpoolRepository`インターフェース（T67〜T76で全エンティティ実装済み）を
そのまま満たす、IndexedDB（Dexie.js）版の実装を追加する。UI・ビジネスロジック・
`services/`配下の呼び出し元は`docs/08`同様に変更しない（③データ保存層のみを差し替える）。

---

# 2. storageMode切り替え機構

## 決定事項

**ビルド時にVite `resolve.alias`で静的に切り替える。** 実行時の`if`分岐やPartialオブジェクトの
出し分けでは、Firebase SDK・Dexieのどちらのコードも常に両方バンドルに含まれてしまう
（tree-shakingは「使われていないexport」は削除できても、「常に実行される可能性がある
条件分岐の片側」までは確実に削除できない）。ビルド設定レベルでモジュール解決先自体を
切り替えることで、片方のコードを完全にバンドルから除外する。

## 実装方針

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      '@repository': path.resolve(
        __dirname,
        mode === 'local'
          ? 'src/repositories/dexie/index.ts'
          : 'src/repositories/firestore/index.ts'
      ),
    },
  },
  // ...
}));
```

- `services/`配下・`carpoolMember.ts`は、現在の
  `import { firestoreRepository } from '../../repositories/firestore';`を
  `import { repository } from '@repository';`に置き換える（T77以降で対応）
- `@repository`は常に`CarpoolRepository`を満たすオブジェクトをエクスポートする
  という契約のみを共有し、呼び出し元はFirestore/Dexieどちらの実装かを意識しない
- ビルドコマンドは`vite build --mode local`（公開版）／`vite build --mode cloud`
  ※`--mode`未指定時の通常`vite build`は現状通り自チーム版（Firestore）とする
  （既存の`npm run build`・`.github/workflows/firebase-deploy.yml`は無改修で
  自チーム版ビルドのまま動作し続ける）
- `package.json`に`build:local`スクリプトを追加する（`vite build --mode local`）

---

# 3. ID生成方式

**`crypto.randomUUID()`を使う。** Dexieの自動採番（`++id`、number型）は使わない。

- `CarpoolRepository`の`create*`系メソッドはすべて`Promise<string>`を返す契約であり、
  Firestoreの自動発行ID（文字列）とそのまま型互換にするため
- ブラウザ標準API（`crypto.randomUUID()`）のみで完結し、追加ライブラリ不要
- Dexieの各テーブルは`id`を文字列の主キーとして定義する（`++id`は使わない）

---

# 4. Dexieスキーマ設計

IndexedDBにはFirestoreのようなサブコレクションの概念がないため、
`events/{eventId}/responses/{familyId}`・`events/{eventId}/carpools/{carpoolId}`は
それぞれ独立したフラットテーブルとし、`eventId`を外部キーとして持たせてインデックスを張る。

```typescript
// src/repositories/dexie/db.ts
import Dexie, { type EntityTable } from 'dexie';
import type { Family, Player, Coach, FamilyMember, PickupLocation, Destination } from '../../types/master';
import type { Event, Response, Carpool } from '../../types/event';

// Responseはドキュメント本体にfamilyIdを持たない（Firestore側はドキュメントIDそのものが
// familyId）ため、Dexie側では複合主キー用にfamilyId・eventIdを明示フィールドとして持たせる
interface ResponseRecord extends Response {
  eventId: string;
  familyId: string;
}

interface CarpoolRecord extends Carpool {
  eventId: string;
}

class CarpoolBridgeDB extends Dexie {
  families!: EntityTable<Family, 'id'>;
  players!: EntityTable<Player, 'id'>;
  coaches!: EntityTable<Coach, 'id'>;
  familyMembers!: EntityTable<FamilyMember, 'id'>;
  pickupLocations!: EntityTable<PickupLocation, 'id'>;
  destinations!: EntityTable<Destination, 'id'>;
  events!: EntityTable<Event, 'id'>;
  responses!: EntityTable<ResponseRecord, 'familyId'>;
  carpools!: EntityTable<CarpoolRecord, 'id'>;

  constructor() {
    super('carpoolbridge');
    this.version(1).stores({
      families: 'id, isActive',
      players: 'id, familyId, isActive',
      coaches: 'id, familyId, isActive',
      familyMembers: 'id, familyId, isActive',
      pickupLocations: 'id',
      destinations: 'id',
      events: 'id, date',
      responses: '[eventId+familyId], eventId',
      carpools: 'id, eventId, [eventId+direction]',
    });
  }
}

export const db = new CarpoolBridgeDB();
```

- `responses`テーブルの主キーは`[eventId+familyId]`の複合キー（Firestoreの
  `events/{eventId}/responses/{familyId}`と1:1対応）
- `carpools`テーブルは`[eventId+direction]`の複合indexを持たせ、
  `getCarpools(eventId, direction)`のクエリに使う
- `getPastEventsPage`のカーソルページネーション（`date`降順＋`documentId`降順）は、
  Dexie側では`events`テーブルを`date`インデックスで取得し、アプリ側でid比較を
  組み合わせて実装する（Firestoreの複合カーソルクエリの単純な移植はできないため、
  実装詳細はT8x側で個別に設計する）

---

# 5. 影響範囲・タスク分割方針

`docs/08`のT67〜T76と対になる形で、以下の2系統のタスクに分割する
（`docs/50_タスク作成ルール.md`の粒度に従う）。

## 系統A: DexieRepository実装（エンティティ単位、T67〜T76と同じ9分割）

Player→Coach→FamilyMember→Family→PickupLocation→Destination→Response→Carpool→Event
の順（カスケード処理がある関係で、依存関係はdocs/08の8章と同じ制約を引き継ぐ）。

## 系統B: storageMode切り替え配線（横断）

- `vite.config.ts`の`resolve.alias`設定
- `package.json`の`build:local`スクリプト追加
- `services/`配下10ファイル・`carpoolMember.ts`のimport切り替え
  （`firestoreRepository`直接importから`@repository`経由へ）
- `.env.local.sample`等、公開版ビルド用の環境変数サンプル整備（公開版は
  Firebase関連の環境変数が不要になるため、既存`.env.sample`とは別に用意する）

系統Bは系統Aの全エンティティ実装が完了してから着手する
（`@repository`が`CarpoolRepository`を完全に満たさないと型エラーになるため）。

---

# 6. 対象外

- E2Eテスト（Playwright）の公開版（Dexie）対応。現状のE2E基盤はFirebase Emulator
  前提のため、公開版のテスト方針は別途検討する
- Google Drive同期、PWA化、TWA/Google Play公開、広告（`docs/08`同様に対象外のまま）

---

# 7. 次にやること

1. 本ドキュメントの内容を人間がレビュー・承認する
2. 承認後、`docs/50_タスク作成ルール.md`に従い、5章の系統A（T77〜T85相当）・
   系統B（T86以降相当）を`tasks/`へタスクファイルとして作成する
3. `dexie`パッケージを`package.json`に追加する
4. 系統A→系統Bの順に実装する
