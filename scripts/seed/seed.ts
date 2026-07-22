/**
 * 開発用Seedスクリプト（`npm run seed`）。
 *
 * docs/05_データ設計.md のコレクション構成に合わせたテストデータ
 * （src/services/dev/seedData.ts。「サンプルデータ投入」ボタンと共通）を
 * Firestoreへ投入する。ドキュメントIDは固定値、Admin SDKのset()（setDoc相当）で書き込むため、
 * 何度実行しても同じ状態になる（既存データの削除は行わない）。
 *
 * 投入先は常に .firebaserc の projects.default（実Firebaseプロジェクト）。
 *
 * 実行方法・注意事項はREADME.mdを参照。
 */
import { readFileSync } from 'node:fs';
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
} from '../../src/services/dev/seedData';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

// createdAt/updatedAtも固定値にすることで、再実行してもドキュメント内容が完全に一致するようにする
const SEED_TIMESTAMP = Timestamp.fromDate(new Date('2026-07-01T00:00:00+09:00'));

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
  console.log(`[seed] 投入先: 実Firebaseプロジェクト / project=${projectId}`);

  const app = initializeApp({ projectId });
  const db = getFirestore(app);

  await seedCollection(db, firestorePaths.pickupLocationsCollection(), PICKUP_LOCATIONS);
  await seedCollection(db, firestorePaths.destinationsCollection(), DESTINATIONS);

  await seedCollection(db, firestorePaths.familiesCollection(), FAMILIES, {
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  });

  await seedCollection(
    db,
    firestorePaths.childrenCollection(),
    CHILDREN.map(({ grade, ...rest }) => ({
      ...rest,
      schoolEntryYear: schoolEntryYearOf(grade),
    })),
    { createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP }
  );

  await seedCollection(db, firestorePaths.eventsCollection(), EVENTS, {
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
