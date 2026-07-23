import { collection, doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { firestorePaths } from '../../constants';
import { CHILDREN, DESTINATIONS, EVENTS, FAMILIES, PICKUP_LOCATIONS, schoolEntryYearOf } from './seedData';

const DELETE_BATCH_SIZE = 400;

/**
 * 指定コレクション配下の全ドキュメントを物理削除します。
 */
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

/**
 * 全イベントを、配下のサブコレクション（responses・carpools）ごと物理削除します。
 * クライアントSDKには再帰削除がないため、イベントごとにサブコレクションを先に削除してから
 * イベント本体を削除する。
 */
async function deleteAllEventsWithSubcollections(): Promise<void> {
  const eventsSnapshot = await getDocs(collection(db, firestorePaths.eventsCollection()));

  for (const eventDoc of eventsSnapshot.docs) {
    await deleteAllDocsInCollection(firestorePaths.responsesCollection(eventDoc.id));
    await deleteAllDocsInCollection(firestorePaths.carpoolsCollection(eventDoc.id));
  }

  await deleteAllDocsInCollection(firestorePaths.eventsCollection());
}

/**
 * 開発環境限定の「サンプルデータ投入」機能。
 *
 * 既存の集合場所・目的地・家庭・子供・イベント（配下のresponses・carpoolsを含む）を
 * 全削除したうえで、評価・動作確認用のテストデータ
 * （src/services/dev/seedData.ts。`npm run seed` と共通）を投入する。
 * ドキュメントIDは固定値のため、`npm run seed` で投入した場合と同一のドキュメントになる。
 * staffUsersは削除対象外（認証済みユーザーの権限情報のため、都度作り直す運用ではない）。
 *
 * データの物理削除は、通常の運用では行わない例外的な操作（docs/05_データ設計.md
 * 「11. 削除方針」の例外を参照）であり、本機能以外からは呼び出さないこと。
 */
export async function seedSampleData(): Promise<void> {
  await deleteAllDocsInCollection(firestorePaths.childrenCollection());
  await deleteAllDocsInCollection(firestorePaths.familiesCollection());
  await deleteAllDocsInCollection(firestorePaths.pickupLocationsCollection());
  await deleteAllDocsInCollection(firestorePaths.destinationsCollection());
  await deleteAllEventsWithSubcollections();

  const batch = writeBatch(db);

  PICKUP_LOCATIONS.forEach(({ id, ...rest }) => {
    batch.set(doc(db, firestorePaths.pickupLocationDocument(id)), rest);
  });

  DESTINATIONS.forEach(({ id, ...rest }) => {
    batch.set(doc(db, firestorePaths.destinationDocument(id)), rest);
  });

  FAMILIES.forEach(({ id, ...rest }) => {
    batch.set(doc(db, firestorePaths.familyDocument(id)), {
      ...rest,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  CHILDREN.forEach(({ id, grade, ...rest }) => {
    batch.set(doc(db, firestorePaths.childDocument(id)), {
      ...rest,
      schoolEntryYear: schoolEntryYearOf(grade),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  EVENTS.forEach(({ id, ...rest }) => {
    batch.set(doc(db, firestorePaths.eventDocument(id)), {
      ...rest,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}
