import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { firestorePaths } from '../../constants';
import type { Coach } from '../../types/master';

/**
 * コーチを新規登録します。
 * isActive は true、createdAt・updatedAt はサーバー時刻で自動設定されます。
 *
 * @param data 登録するデータ（id・isActive・createdAt・updatedAt を除くフィールド）
 * @returns 登録されたドキュメントのID
 */
export async function createCoach(
  data: Omit<Coach, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const colRef = collection(db, firestorePaths.coachesCollection());
  const docRef = await addDoc(colRef, {
    ...data,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * 指定した家庭に属するコーチの一覧を取得します。
 *
 * @param familyId 対象の家庭ID
 * @returns コーチの配列
 */
export async function getCoachesByFamilyId(familyId: string): Promise<Coach[]> {
  const colRef = collection(db, firestorePaths.coachesCollection());
  const q = query(colRef, where('familyId', '==', familyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Coach));
}

/**
 * コーチの name・isActive を更新します。
 * 更新時に updatedAt をサーバー時刻で更新します。
 *
 * @param coachId 更新対象のドキュメントID
 * @param data 更新するフィールド（部分更新可）
 */
export async function updateCoach(
  coachId: string,
  data: Partial<Pick<Coach, 'name' | 'isActive'>>
): Promise<void> {
  const docRef = doc(db, firestorePaths.coachDocument(coachId));
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * コーチを物理削除します（登録ミスの取り消し用）。
 * 過去の回答・配車結果から参照中でも削除する（05_データ設計.md#12 削除方針）。
 *
 * @param coachId 削除対象のドキュメントID
 */
export async function deleteCoach(coachId: string): Promise<void> {
  const docRef = doc(db, firestorePaths.coachDocument(coachId));
  await deleteDoc(docRef);
}

/**
 * 指定した家庭に属するコーチを、全て物理削除します。
 * 家庭が削除された際に道連れで呼び出されます（05_データ設計.md#12 削除方針）。
 *
 * @param familyId 対象の家庭ID
 */
export async function deleteCoachesByFamilyId(familyId: string): Promise<void> {
  const colRef = collection(db, firestorePaths.coachesCollection());
  const q = query(colRef, where('familyId', '==', familyId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return;
  }

  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
