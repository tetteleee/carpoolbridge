import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  addDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { firestorePaths } from '../../constants';
import type { Carpool, Direction } from '../../types/event';

/**
 * 配車結果（車ごとレコード）を新規登録します。
 * ドキュメントIDはFirestoreが自動採番します。
 *
 * @param eventId 対象のイベントID
 * @param data 登録するデータ（idを除くフィールド）
 * @returns 登録されたドキュメントのID
 */
export async function createCarpool(
  eventId: string,
  data: Omit<Carpool, 'id'>
): Promise<string> {
  const colRef = collection(db, firestorePaths.carpoolsCollection(eventId));
  const docRef = await addDoc(colRef, data);
  return docRef.id;
}

/**
 * 指定イベント配下の配車結果一覧を取得します。
 * directionを指定した場合はその方向のみに絞り込みます。
 *
 * @param eventId 対象のイベントID
 * @param direction 絞り込む方向（省略時は全件取得）
 * @returns 配車結果の配列
 */
export async function getCarpools(
  eventId: string,
  direction?: Direction
): Promise<Carpool[]> {
  const colRef = collection(db, firestorePaths.carpoolsCollection(eventId));
  const queryRef = direction ? query(colRef, where('direction', '==', direction)) : colRef;
  const snapshot = await getDocs(queryRef);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Carpool));
}

/**
 * 指定イベント・配車結果を1件取得します。
 *
 * @param eventId 対象のイベントID
 * @param carpoolId 対象の配車結果ID
 * @returns 配車結果。ドキュメントが存在しない場合はnull
 */
export async function getCarpool(
  eventId: string,
  carpoolId: string
): Promise<Carpool | null> {
  const docRef = doc(db, firestorePaths.carpoolDocument(eventId, carpoolId));
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null;
  }
  return { id: docSnap.id, ...docSnap.data() } as Carpool;
}

/**
 * 既存の配車結果を更新します。
 *
 * @param eventId 対象のイベントID
 * @param carpoolId 対象の配車結果ID
 * @param data 更新するフィールド（部分更新可）
 */
export async function updateCarpool(
  eventId: string,
  carpoolId: string,
  data: Partial<Omit<Carpool, 'id'>>
): Promise<void> {
  const docRef = doc(db, firestorePaths.carpoolDocument(eventId, carpoolId));
  await updateDoc(docRef, data);
}
