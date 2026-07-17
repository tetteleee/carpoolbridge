import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { firestorePaths } from '../../constants';
import type { Destination } from '../../types/master';

/**
 * 目的地を新規登録します。
 *
 * @param data 登録するデータ（id を除くフィールド）
 * @returns 登録されたドキュメントのID
 */
export async function createDestination(
  data: Omit<Destination, 'id'>
): Promise<string> {
  const colRef = collection(db, firestorePaths.destinationsCollection());
  const docRef = await addDoc(colRef, data);
  return docRef.id;
}

/**
 * 目的地の一覧を取得します。
 *
 * @returns 目的地の配列
 */
export async function getDestinations(): Promise<Destination[]> {
  const colRef = collection(db, firestorePaths.destinationsCollection());
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Destination));
}

/**
 * 目的地を1件取得します。
 *
 * @param destinationId 取得対象のドキュメントID
 * @returns 目的地。ドキュメントが存在しない場合は null
 */
export async function getDestination(
  destinationId: string
): Promise<Destination | null> {
  const docRef = doc(db, firestorePaths.destinationDocument(destinationId));
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null;
  }
  return { id: docSnap.id, ...docSnap.data() } as Destination;
}

/**
 * 目的地の name・address・latitude・longitude を更新します。
 *
 * @param destinationId 更新対象のドキュメントID
 * @param data 更新するフィールド（部分更新可）
 */
export async function updateDestination(
  destinationId: string,
  data: Partial<Pick<Destination, 'name' | 'address' | 'latitude' | 'longitude'>>
): Promise<void> {
  const docRef = doc(db, firestorePaths.destinationDocument(destinationId));
  await updateDoc(docRef, data);
}

/**
 * 目的地を物理削除します。
 * （Destination には isActive フィールドが存在しないため論理削除は行いません）
 *
 * @param destinationId 削除対象のドキュメントID
 */
export async function deleteDestination(destinationId: string): Promise<void> {
  const docRef = doc(db, firestorePaths.destinationDocument(destinationId));
  await deleteDoc(docRef);
}
