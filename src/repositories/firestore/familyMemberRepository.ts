/**
 * FamilyMember分のFirestoreRepository実装
 * ref: docs/08_公開版アーキテクチャ設計.md#5 CarpoolRepositoryインターフェース（ファイル構成）
 */

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
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { firestorePaths } from '../../constants';
import type { FamilyMember } from '../../types/master';
import type { CarpoolRepository } from '../CarpoolRepository';

/** FirestoreのドキュメントスナップショットをFamilyMember型へ変換する（Timestamp→Dateの変換を含む） */
function toFamilyMember(d: QueryDocumentSnapshot<DocumentData>): FamilyMember {
  const data = d.data();
  return {
    id: d.id,
    familyId: data.familyId,
    name: data.name,
    isActive: data.isActive,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
}

export const familyMemberRepository: Pick<
  CarpoolRepository,
  | 'createFamilyMember'
  | 'getFamilyMembersByFamilyId'
  | 'getAllFamilyMembers'
  | 'updateFamilyMember'
  | 'deleteFamilyMember'
  | 'deleteFamilyMembersByFamilyId'
> = {
  async createFamilyMember(data) {
    const colRef = collection(db, firestorePaths.familyMembersCollection());
    const docRef = await addDoc(colRef, {
      ...data,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async getFamilyMembersByFamilyId(familyId) {
    const colRef = collection(db, firestorePaths.familyMembersCollection());
    const q = query(colRef, where('familyId', '==', familyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(toFamilyMember);
  },

  async getAllFamilyMembers() {
    const colRef = collection(db, firestorePaths.familyMembersCollection());
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(toFamilyMember);
  },

  async updateFamilyMember(familyMemberId, data) {
    const docRef = doc(db, firestorePaths.familyMemberDocument(familyMemberId));
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteFamilyMember(familyMemberId) {
    const docRef = doc(db, firestorePaths.familyMemberDocument(familyMemberId));
    await deleteDoc(docRef);
  },

  async deleteFamilyMembersByFamilyId(familyId) {
    const colRef = collection(db, firestorePaths.familyMembersCollection());
    const q = query(colRef, where('familyId', '==', familyId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  },
};
