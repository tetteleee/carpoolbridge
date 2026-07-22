import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { firestorePaths } from '../../constants';
import type { Family } from '../../types/master';
import { deactivateChildrenByFamilyId } from './childService';

/**
 * 家庭を新規登録します。
 * isActive は true、createdAt・updatedAt はサーバー時刻で自動設定されます。
 *
 * @param data 登録するデータ（id・isActive・createdAt・updatedAt を除くフィールド）
 * @returns 登録されたドキュメントのID
 */
export async function createFamily(
  data: Omit<Family, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const colRef = collection(db, firestorePaths.familiesCollection());
  const docRef = await addDoc(colRef, {
    ...data,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * 家庭の一覧を取得します。
 *
 * @returns 家庭の配列
 */
export async function getFamilies(): Promise<Family[]> {
  const colRef = collection(db, firestorePaths.familiesCollection());
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Family));
}

/**
 * 家庭を1件取得します。
 *
 * @param familyId 取得対象のドキュメントID
 * @returns 家庭。ドキュメントが存在しない場合は null
 */
export async function getFamily(familyId: string): Promise<Family | null> {
  const docRef = doc(db, firestorePaths.familyDocument(familyId));
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null;
  }
  return { id: docSnap.id, ...docSnap.data() } as Family;
}

/**
 * 家庭の familyName・coachName・vehicleCapacity・pickupLocationId・isActive を更新します。
 * isActive を false にすることで論理削除（卒団・非表示扱い）、true に戻すことで在籍復帰を表します。
 * 更新時に updatedAt をサーバー時刻で更新します。
 *
 * isActive を false に更新した場合、この家庭に属する子供も連動して自動で論理削除されます。
 *
 * @param familyId 更新対象のドキュメントID
 * @param data 更新するフィールド（部分更新可）
 */
export async function updateFamily(
  familyId: string,
  data: Partial<
    Pick<
      Family,
      'familyName' | 'coachName' | 'vehicleCapacity' | 'pickupLocationId' | 'isActive'
    >
  >
): Promise<void> {
  const docRef = doc(db, firestorePaths.familyDocument(familyId));
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });

  if (data.isActive === false) {
    await deactivateChildrenByFamilyId(familyId);
  }
}
