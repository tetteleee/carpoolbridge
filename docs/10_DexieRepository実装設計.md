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
        mode === 'public'
          ? 'src/repositories/dexie/index.ts'
          : 'src/repositories/firestore/index.ts'
      ),
    },
  },
  // ...
}));
```

（実装時の注記: 当初mode名を`local`とする想定だったが、Viteは`local`を`.env.local`の
サフィックスと衝突する予約語としており、mode名に使えない。`public`に変更した。）

- `services/`配下・`carpoolMember.ts`は、現在の
  `import { firestoreRepository } from '../../repositories/firestore';`を
  `import { repository } from '@repository';`に置き換える（T88で対応）
- `@repository`は常に`CarpoolRepository`を満たすオブジェクトをエクスポートする
  という契約のみを共有し、呼び出し元はFirestore/Dexieどちらの実装かを意識しない
- ビルドコマンドは`vite build --mode public`（公開版）／`--mode`未指定の通常`vite build`
  （自チーム版）
  （既存の`npm run build`・`.github/workflows/firebase-deploy.yml`は無改修で
  自チーム版ビルドのまま動作し続ける）

## `@app-shell`エイリアス（認証の有無の切り替え）

`@repository`と同じ仕組みを、認証（Firebase Authentication・staffUsers確認）の有無にも
適用する。自チーム版は`App.tsx`相当の認証ガード込みシェル、公開版は認証を一切持たない
シェルを、それぞれ独立したファイルとして用意し`resolve.alias`で切り替える。

- `src/appShell/CloudAppShell.tsx`: 匿名認証・`staffUsers`確認・`AuthGuard`によるルーティング
  制御を行う（旧`App.tsx`の中身をそのまま移設したもの）
- `src/appShell/PublicAppShell.tsx`: 認証を一切行わず`<BrowserRouter><AppRoutes /></BrowserRouter>`
  のみを返す
- `App.tsx`は`import { AppShell } from '@app-shell'; return <AppShell />;`のみに簡素化する
- `vite.config.ts`の`resolve.alias`に`@app-shell`を追加し、`mode === 'public'`で
  `PublicAppShell.tsx`、それ以外で`CloudAppShell.tsx`に切り替える
- `tsconfig.app.json`の`paths`にも`@app-shell`（自チーム版を参照先）を追加する
- `package.json`に`build:public`スクリプトを追加する（`vite build --mode public`）

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

`docs/08`のT67〜T76と対になる形で、以下の2系統・12タスク（T77〜T88）に分割した
（`docs/50_タスク作成ルール.md`の粒度に従う）。

## 系統A: DexieRepository実装（T77〜T86）

| タスク | 内容 | 備考 |
|---|---|---|
| T77 | Dexie基盤（`db.ts`全テーブル定義・`dexie/index.ts`の空の器） | T67のDexie版 |
| T78 | Player DexieRepository実装 | |
| T79 | Coach DexieRepository実装 | |
| T80 | FamilyMember DexieRepository実装 | |
| T81 | Family DexieRepository実装 | `deleteFamily`のカスケードがT78〜T80に依存するため後回し |
| T82 | PickupLocation DexieRepository実装 | |
| T83 | Destination DexieRepository実装 | |
| T84 | Response DexieRepository実装 | |
| T85 | Carpool DexieRepository実装（`saveCarpools`含む） | |
| T86 | Event DexieRepository実装 | `deleteEvent`のカスケードがT84・T85に依存するため最後 |

依存関係はdocs/08の8章（Firestore版）と同じ制約を引き継ぐ。

## 系統B: storageMode切り替え配線（T87〜T88）

| タスク | 内容 |
|---|---|
| T87 | `vite.config.ts`の`resolve.alias`設定・`package.json`の`build:public`スクリプト追加 |
| T88 | `services/`配下9ファイル・`carpoolMember.ts`のimportを`@repository`経由に切り替え |

系統Bは系統Aの全エンティティ実装が完了してから着手する
（`@repository`が`CarpoolRepository`を完全に満たさないと型エラーになるため）。
公開版ビルドに新規の環境変数は不要なため、`.env.local.sample`等の追加整備は行わない。

---

# 6. 対象外

- Google Drive同期、PWA化、TWA/Google Play公開、広告（`docs/08`同様に対象外のまま）
- ~~E2Eテスト（Playwright）の公開版（Dexie）対応~~ **解決済み**（8章参照）
- ~~認証UI・ルーティングの公開版対応~~ **解決済み**（`@app-shell`エイリアスで対応。
  2章参照）。T88実装直後は`App.tsx`の認証ガード（`useAuth`・`checkStaffUserRegistration`）が
  storageModeに関わらず常時有効なままで、`services/auth/staffUserService.ts`が
  `firebase/firestore`を直接使うため公開版ビルドにもFirestore SDK本体を含むFirebase一式が
  残っていたが、`@app-shell`による切り替えで公開版ビルドから完全に除外した
  （`npm run build:public`成果物に`firebase`関連チャンク・文字列が一切含まれないことを確認済み）
- ~~開発用サンプルデータ・サンプル回答生成ボタンのFirestore依存~~ **解決済み**。
  `DevSampleDataButton.tsx`・`DevSampleResponseButton.tsx`は`import.meta.env.DEV`で
  表示自体はガードされていたが、`seedSampleData`/`generateSampleResponses`の
  importが静的だったため、`MasterPage`・`EventEditPage`の遅延読み込みチャンクに
  Firestore依存コードが混入していた。クリックハンドラ内での動的import（
  `await import('../../services/dev/seedSampleData')`）に変更し解消した

---

# 8. 公開版E2Eテスト設計

## テスト範囲

UI・ビジネスロジックは自チーム版と完全に共通コードであり、既存の`e2e/`配下16本で
すでに検証済みのため、公開版で重複検証はしない。公開版E2Eは**DexieRepository固有の
リスクにのみ絞ったスモークテスト**（5本程度）とする。

- マスタデータ（集合場所・家庭等）のCRUDが、ページリロードを跨いでIndexedDBに永続化される
- イベント作成 → 回答入力 → 自動配車という一連のDexieRepository読み書きチェーンが通しで動く
- 配車結果画面のドラッグ&ドロップで、`saveCarpools`のupsert・原子性が実際に機能する
  （移動元・移動先の両方が正しく更新される）
- 家庭削除時、選手・コーチ・家族への道連れ削除カスケードがDexie上でも機能する
- 過去イベントの「もっと見る」ページネーション（`getPastEventsPage`のメモリ上カーソル実装）が
  重複・漏れなく機能する

## テスト基盤

自チーム版のE2E基盤（Firebase Emulator Suite必須）とは前提が異なるため、別のPlaywright設定・
テストディレクトリとして構築する。既存の`e2e/`・`playwright.config.ts`は変更しない。

```text
playwright.public.config.ts   # 公開版E2E用の設定（新規）
e2e-public/                   # 公開版E2Eテスト（新規）
  utils/
    fixtures.ts                 # skipTutorial等（clearFirestore相当は不要。後述）
    seedDexie.ts                 # window.__dexieDb経由の高速データ投入ヘルパー
  master-data-persistence.spec.ts
  event-response-carpool-flow.spec.ts
  carpool-drag-and-drop.spec.ts
  family-delete-cascade.spec.ts
  past-events-pagination.spec.ts
```

### ビルドmode

新設のビルドmode`public-e2e`で`vite dev`を起動する。`vite.config.ts`の`resolve.alias`は
`mode === 'public'`の判定を`mode.startsWith('public')`に変更し、`public`・`public-e2e`
どちらでもDexie版・`PublicAppShell`が使われるようにする。

### テストデータの高速投入（デバッグ用windowフック）

既存の自チーム版E2Eは、Firebase Admin SDKでSecurity Rulesを介さず直接Firestoreへ
書き込むことで、UI操作を介さない高速なテスト前提データ投入を行っている
（`e2e/utils/firebaseAdmin.ts`）。公開版はサーバーを持たないため同じ手段が使えず、
代わりに**`public-e2e`ビルドmode限定でDexieのdbインスタンスを`window`に公開する**。

```typescript
// src/repositories/dexie/db.ts
if (import.meta.env.VITE_EXPOSE_DEXIE_DB === 'true') {
  (window as unknown as { __dexieDb?: typeof db }).__dexieDb = db;
}
```

`.env.public-e2e`で`VITE_EXPOSE_DEXIE_DB=true`を設定する。本番の公開版ビルド
（`--mode public`、環境変数なし）ではこのフックは一切含まれない
（`import.meta.env.VITE_EXPOSE_DEXIE_DB`は未設定＝`undefined`のため、
if文の条件が静的にfalseと判定されtree-shakingで除去される）。

テストからは`page.evaluate()`経由で`window.__dexieDb`のテーブルに直接read/writeする。

### テスト分離（Firestore Emulatorのクリア相当は不要）

Playwrightは既定で各テストに新しいBrowserContext（＝新しいIndexedDB）を割り当てるため、
Firestore Emulatorのように明示的なクリア処理（`e2e/utils/fixtures.ts`の`clearFirestore`）は
不要。テスト間のデータ分離は自動的に確保される。

### 認証まわり

公開版は認証を持たないため（`PublicAppShell`、`docs/10`#2参照）、既存e2eの
`registerAsStaffAndReload`のようなダンスは不要。`page.goto()`で直接目的の画面へアクセスできる。

---

# 7. 次にやること

1. 本ドキュメントの内容を人間がレビュー・承認する（完了）
2. `docs/50_タスク作成ルール.md`に従い、5章のT77〜T88を`tasks/`へタスクファイルとして
   作成する（完了）
3. `dexie`パッケージを`package.json`に追加する（完了）
4. 系統A→系統Bの順に実装する（完了）
5. 8章に従い、公開版E2Eテスト基盤・スモークテスト5本を実装する
