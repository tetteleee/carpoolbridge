/**
 * Coach分のFirestoreRepository実装
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
  setDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { firestorePaths } from '../../constants';
import type { Coach } from '../../types/master';
import type { CarpoolRepository } from '../CarpoolRepository';

/** FirestoreのドキュメントスナップショットをCoach型へ変換する（Timestamp→Dateの変換を含む） */
function toCoach(d: QueryDocumentSnapshot<DocumentData>): Coach {
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

export const coachRepository: Pick<
  CarpoolRepository,
  | 'createCoach'
  | 'getCoachesByFamilyId'
  | 'getAllCoaches'
  | 'updateCoach'
  | 'deleteCoach'
  | 'deleteCoachesByFamilyId'
  | 'restoreCoach'
> = {
  async createCoach(data) {
    const colRef = collection(db, firestorePaths.coachesCollection());
    const docRef = await addDoc(colRef, {
      ...data,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async getCoachesByFamilyId(familyId) {
    const colRef = collection(db, firestorePaths.coachesCollection());
    const q = query(colRef, where('familyId', '==', familyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(toCoach);
  },

  async getAllCoaches() {
    const colRef = collection(db, firestorePaths.coachesCollection());
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(toCoach);
  },

  async updateCoach(coachId, data) {
    const docRef = doc(db, firestorePaths.coachDocument(coachId));
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteCoach(coachId) {
    const docRef = doc(db, firestorePaths.coachDocument(coachId));
    await deleteDoc(docRef);
  },

  async deleteCoachesByFamilyId(familyId) {
    const colRef = collection(db, firestorePaths.coachesCollection());
    const q = query(colRef, where('familyId', '==', familyId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  },

  async restoreCoach(coach) {
    const docRef = doc(db, firestorePaths.coachDocument(coach.id));
    await setDoc(docRef, {
      familyId: coach.familyId,
      name: coach.name,
      isActive: coach.isActive,
      createdAt: Timestamp.fromDate(coach.createdAt),
      updatedAt: Timestamp.fromDate(coach.updatedAt),
    });
  },
};
