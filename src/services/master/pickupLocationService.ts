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
import type { PickupLocation } from '../../types/master';

/**
 * 集合場所を新規登録します。
 *
 * @param data 登録するデータ（id を除くフィールド）
 * @returns 登録されたドキュメントのID
 */
export async function createPickupLocation(
  data: Omit<PickupLocation, 'id'>
): Promise<string> {
  const colRef = collection(db, firestorePaths.pickupLocationsCollection());
  const docRef = await addDoc(colRef, data);
  return docRef.id;
}

/**
 * 集合場所の一覧を取得します。
 *
 * @returns 集合場所の配列
 */
export async function getPickupLocations(): Promise<PickupLocation[]> {
  const colRef = collection(db, firestorePaths.pickupLocationsCollection());
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PickupLocation));
}

/**
 * 集合場所を1件取得します。
 *
 * @param locationId 取得対象のドキュメントID
 * @returns 集合場所。ドキュメントが存在しない場合は null
 */
export async function getPickupLocation(
  locationId: string
): Promise<PickupLocation | null> {
  const docRef = doc(db, firestorePaths.pickupLocationDocument(locationId));
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null;
  }
  return { id: docSnap.id, ...docSnap.data() } as PickupLocation;
}

/**
 * 集合場所の name・address・latitude・longitude を更新します。
 *
 * @param locationId 更新対象のドキュメントID
 * @param data 更新するフィールド（部分更新可）
 */
export async function updatePickupLocation(
  locationId: string,
  data: Partial<Pick<PickupLocation, 'name' | 'address' | 'latitude' | 'longitude'>>
): Promise<void> {
  const docRef = doc(db, firestorePaths.pickupLocationDocument(locationId));
  await updateDoc(docRef, data);
}

/**
 * 集合場所を物理削除します。
 * （PickupLocation には isActive フィールドが存在しないため論理削除は行いません）
 *
 * @param locationId 削除対象のドキュメントID
 */
export async function deletePickupLocation(locationId: string): Promise<void> {
  const docRef = doc(db, firestorePaths.pickupLocationDocument(locationId));
  await deleteDoc(docRef);
}
