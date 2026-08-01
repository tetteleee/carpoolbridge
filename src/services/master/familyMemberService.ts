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
import type { FamilyMember } from '../../types/master';

/**
 * 家族を新規登録します。
 * isActive は true、createdAt・updatedAt はサーバー時刻で自動設定されます。
 *
 * @param data 登録するデータ（id・isActive・createdAt・updatedAt を除くフィールド）
 * @returns 登録されたドキュメントのID
 */
export async function createFamilyMember(
  data: Omit<FamilyMember, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const colRef = collection(db, firestorePaths.familyMembersCollection());
  const docRef = await addDoc(colRef, {
    ...data,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * 指定した家庭に属する家族の一覧を取得します。
 *
 * @param familyId 対象の家庭ID
 * @returns 家族の配列
 */
export async function getFamilyMembersByFamilyId(familyId: string): Promise<FamilyMember[]> {
  const colRef = collection(db, firestorePaths.familyMembersCollection());
  const q = query(colRef, where('familyId', '==', familyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FamilyMember));
}

/**
 * 家族の name・isActive を更新します。
 * 更新時に updatedAt をサーバー時刻で更新します。
 *
 * @param familyMemberId 更新対象のドキュメントID
 * @param data 更新するフィールド（部分更新可）
 */
export async function updateFamilyMember(
  familyMemberId: string,
  data: Partial<Pick<FamilyMember, 'name' | 'isActive'>>
): Promise<void> {
  const docRef = doc(db, firestorePaths.familyMemberDocument(familyMemberId));
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 家族を物理削除します（登録ミスの取り消し用）。
 * 過去の回答・配車結果から参照中でも削除する（05_データ設計.md#12 削除方針）。
 *
 * @param familyMemberId 削除対象のドキュメントID
 */
export async function deleteFamilyMember(familyMemberId: string): Promise<void> {
  const docRef = doc(db, firestorePaths.familyMemberDocument(familyMemberId));
  await deleteDoc(docRef);
}

/**
 * 指定した家庭に属する家族を、全て物理削除します。
 * 家庭が削除された際に道連れで呼び出されます（05_データ設計.md#12 削除方針）。
 *
 * @param familyId 対象の家庭ID
 */
export async function deleteFamilyMembersByFamilyId(familyId: string): Promise<void> {
  const colRef = collection(db, firestorePaths.familyMembersCollection());
  const q = query(colRef, where('familyId', '==', familyId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return;
  }

  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
