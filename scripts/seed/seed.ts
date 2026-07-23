/**
 * 開発用Seedスクリプト（`npm run seed`）。
 *
 * 既存の集合場所・目的地・家庭・子供・イベント（配下のresponses・carpoolsを含む）を
 * 全削除したうえで、docs/05_データ設計.md のコレクション構成に合わせたテストデータを
 * Firestoreへ投入する。staffUsersは削除対象外。
 *
 * 投入元は環境変数 SEED_SOURCE で切り替える（デフォルトは sample）。
 * - sample: コミット済みのサンプルデータ（src/services/dev/seedData.ts。
 *   「サンプルデータ投入」ボタンと共通）
 * - local : Gitにコミットしない、個人情報に近いローカル専用データ
 *   （src/services/dev/seedData.local.json。手動作成・編集する）
 *
 * 投入先は常に .firebaserc の projects.default（実Firebaseプロジェクト）。
 * 開発段階では気軽にリセットできることを優先しているが、実運用開始後は
 * このスクリプトをそのまま使わないこと（別の手段を検討する）。
 *
 * 実行方法・注意事項はREADME.mdを参照。
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { firestorePaths } from '../../src/constants';
import {
  CHILDREN,
  DESTINATIONS,
  EVENTS,
  FAMILIES,
  PICKUP_LOCATIONS,
  schoolEntryYearOf,
  type SeedChild,
  type SeedDestination,
  type SeedEvent,
  type SeedFamily,
  type SeedPickupLocation,
} from '../../src/services/dev/seedData';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const LOCAL_SEED_DATA_PATH = resolve(REPO_ROOT, 'src/services/dev/seedData.local.json');

// createdAt/updatedAtも固定値にすることで、再実行してもドキュメント内容が完全に一致するようにする
const SEED_TIMESTAMP = Timestamp.fromDate(new Date('2026-07-01T00:00:00+09:00'));

interface SeedSourceData {
  pickupLocations: SeedPickupLocation[];
  destinations: SeedDestination[];
  families: SeedFamily[];
  children: SeedChild[];
  events: SeedEvent[];
}

/**
 * 環境変数 SEED_SOURCE（sample | local、デフォルトsample）に応じて投入元データを読み込む。
 * localはGitにコミットしない個人情報に近いデータのため、存在しない場合はエラーで停止する
 * （誤って未作成のまま実行し、意図せずサンプルデータのままになることを防ぐ）。
 */
function loadSeedSourceData(): SeedSourceData {
  const source = process.env.SEED_SOURCE ?? 'sample';

  if (source === 'sample') {
    console.log('[seed] 投入元: サンプルデータ（コミット済み / seedData.ts）');
    return {
      pickupLocations: PICKUP_LOCATIONS,
      destinations: DESTINATIONS,
      families: FAMILIES,
      children: CHILDREN,
      events: EVENTS,
    };
  }

  if (source === 'local') {
    if (!existsSync(LOCAL_SEED_DATA_PATH)) {
      throw new Error(
        `SEED_SOURCE=local が指定されましたが、${LOCAL_SEED_DATA_PATH} が見つかりません。`
      );
    }
    console.log(
      '[seed] 投入元: ローカルデータ（個人情報に近いデータ / seedData.local.json、Gitにコミットしない）'
    );
    return JSON.parse(readFileSync(LOCAL_SEED_DATA_PATH, 'utf-8')) as SeedSourceData;
  }

  throw new Error(
    `SEED_SOURCE の値が不正です: "${source}"（"sample" または "local" を指定してください）`
  );
}

/**
 * .firebaserc の projects.default（投入先の実Firebaseプロジェクト）を読み取る。
 */
function readProjectId(): string {
  const rc = JSON.parse(readFileSync(resolve(REPO_ROOT, '.firebaserc'), 'utf-8')) as {
    projects?: { default?: string };
  };
  const projectId = rc.projects?.default;
  if (!projectId) {
    throw new Error('.firebaserc に projects.default が見つかりません');
  }
  return projectId;
}

/**
 * 指定コレクション配下のドキュメントを、サブコレクションを含めて再帰的に全削除する。
 */
async function deleteCollectionRecursively(db: Firestore, collectionPath: string): Promise<void> {
  await db.recursiveDelete(db.collection(collectionPath));
  console.log(`[seed] ${collectionPath}: 削除しました`);
}

/**
 * 指定コレクションへ、固定IDのドキュメント群をset()（全件上書き）する。
 * extraFieldsは全ドキュメント共通で付与するフィールド（createdAt等）。
 */
async function seedCollection<T extends { id: string }>(
  db: Firestore,
  collectionPath: string,
  items: T[],
  extraFields: Record<string, unknown> = {}
): Promise<void> {
  await Promise.all(
    items.map(({ id, ...rest }) =>
      db
        .collection(collectionPath)
        .doc(id)
        .set({ ...rest, ...extraFields })
    )
  );
  console.log(`[seed] ${collectionPath}: ${items.length}件`);
}

async function main(): Promise<void> {
  const projectId = readProjectId();
  const { pickupLocations, destinations, families, children, events } = loadSeedSourceData();
  console.log(`[seed] 投入先: 実Firebaseプロジェクト / project=${projectId}`);

  const app = initializeApp({ projectId });
  const db = getFirestore(app);

  await deleteCollectionRecursively(db, firestorePaths.childrenCollection());
  await deleteCollectionRecursively(db, firestorePaths.familiesCollection());
  await deleteCollectionRecursively(db, firestorePaths.pickupLocationsCollection());
  await deleteCollectionRecursively(db, firestorePaths.destinationsCollection());
  await deleteCollectionRecursively(db, firestorePaths.eventsCollection());

  await seedCollection(db, firestorePaths.pickupLocationsCollection(), pickupLocations);
  await seedCollection(db, firestorePaths.destinationsCollection(), destinations);

  await seedCollection(db, firestorePaths.familiesCollection(), families, {
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  });

  await seedCollection(
    db,
    firestorePaths.childrenCollection(),
    children.map(({ grade, ...rest }) => ({
      ...rest,
      schoolEntryYear: schoolEntryYearOf(grade),
    })),
    { createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP }
  );

  await seedCollection(db, firestorePaths.eventsCollection(), events, {
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  });
}

main()
  .then(() => {
    console.log('[seed] 完了しました');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[seed] 失敗しました:', error);
    process.exit(1);
  });
