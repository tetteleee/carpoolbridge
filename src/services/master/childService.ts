import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { firestorePaths } from '../../constants';
import type { Child } from '../../types/master';

/**
 * 子供を新規登録します。
 * isActive は true、createdAt・updatedAt はサーバー時刻で自動設定されます。
 *
 * @param data 登録するデータ（id・isActive・createdAt・updatedAt を除くフィールド）
 * @returns 登録されたドキュメントのID
 */
export async function createChild(
  data: Omit<Child, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const colRef = collection(db, firestorePaths.childrenCollection());
  const docRef = await addDoc(colRef, {
    ...data,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * 指定した家庭に属する子供の一覧を取得します。
 *
 * @param familyId 対象の家庭ID
 * @returns 子供の配列
 */
export async function getChildrenByFamilyId(familyId: string): Promise<Child[]> {
  const colRef = collection(db, firestorePaths.childrenCollection());
  const q = query(colRef, where('familyId', '==', familyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Child));
}

/**
 * 子供の name・schoolEntryYear・pickupLocationOverride・isActive を更新します。
 * 更新時に updatedAt をサーバー時刻で更新します。
 *
 * @param childId 更新対象のドキュメントID
 * @param data 更新するフィールド（部分更新可）
 */
export async function updateChild(
  childId: string,
  data: Partial<
    Pick<Child, 'name' | 'schoolEntryYear' | 'pickupLocationOverride' | 'isActive'>
  >
): Promise<void> {
  const docRef = doc(db, firestorePaths.childDocument(childId));
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 子供を論理削除します（isActive を false に更新）。
 * ドキュメントは物理削除しません。
 *
 * @param childId 削除対象のドキュメントID
 */
export async function deactivateChild(childId: string): Promise<void> {
  const docRef = doc(db, firestorePaths.childDocument(childId));
  await updateDoc(docRef, {
    isActive: false,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 指定した家庭に属する在籍中の子供を、全て論理削除します（isActive を false に一括更新）。
 * 家庭が無効化された際に呼び出されます。
 *
 * @param familyId 対象の家庭ID
 */
export async function deactivateChildrenByFamilyId(familyId: string): Promise<void> {
  const colRef = collection(db, firestorePaths.childrenCollection());
  const q = query(colRef, where('familyId', '==', familyId), where('isActive', '==', true));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return;
  }

  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => {
    batch.update(d.ref, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}
