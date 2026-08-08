/**
 * バックアップ読み込み専用の全データ削除（clearAllData）Firestore実装
 * ref: docs/12_データバックアップ機能設計.md#6 CarpoolRepositoryインターフェースの拡張
 *
 * クライアントSDKに再帰削除・コレクション一括削除のAPIがないため、全件取得→
 * バッチ削除（400件区切り）で実装する。services/dev/seedSampleData.tsの
 * deleteAllDocsInCollection・deleteAllEventsWithSubcollectionsと同じ方式であり、
 * ロジックが重複している（docs/12_データバックアップ機能設計.md#8で将来の共通化を検討）。
 *
 * staffUsers（認証情報）は削除対象に含めない。
 */

import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { firestorePaths } from '../../constants';
import type { CarpoolRepository } from '../CarpoolRepository';

const DELETE_BATCH_SIZE = 400;

async function deleteAllDocsInCollection(collectionPath: string): Promise<void> {
  const colRef = collection(db, collectionPath);
  const snapshot = await getDocs(colRef);
  const docs = snapshot.docs;

  for (let i = 0; i < docs.length; i += DELETE_BATCH_SIZE) {
    const batch = writeBatch(db);
    docs.slice(i, i + DELETE_BATCH_SIZE).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

async function deleteAllEventsWithSubcollections(): Promise<void> {
  const eventsSnapshot = await getDocs(collection(db, firestorePaths.eventsCollection()));

  for (const eventDoc of eventsSnapshot.docs) {
    await deleteAllDocsInCollection(firestorePaths.responsesCollection(eventDoc.id));
    await deleteAllDocsInCollection(firestorePaths.carpoolsCollection(eventDoc.id));
  }

  await deleteAllDocsInCollection(firestorePaths.eventsCollection());
}

export const clearAllDataRepository: Pick<CarpoolRepository, 'clearAllData'> = {
  async clearAllData() {
    await deleteAllDocsInCollection(firestorePaths.playersCollection());
    await deleteAllDocsInCollection(firestorePaths.coachesCollection());
    await deleteAllDocsInCollection(firestorePaths.familyMembersCollection());
    await deleteAllDocsInCollection(firestorePaths.familiesCollection());
    await deleteAllDocsInCollection(firestorePaths.pickupLocationsCollection());
    await deleteAllDocsInCollection(firestorePaths.destinationsCollection());
    await deleteAllEventsWithSubcollections();
  },
};
