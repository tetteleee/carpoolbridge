/**
 * Family分のFirestoreRepository実装
 * ref: docs/08_公開版アーキテクチャ設計.md#5 CarpoolRepositoryインターフェース（ファイル構成）
 *
 * deleteFamily はここでは単一ドキュメントの削除のみを行う。選手・コーチ・家族の
 * 道連れ削除（カスケード）は services/master/familyService.ts 側の責務とする
 * （ref: docs/08_公開版アーキテクチャ設計.md#7 Repositoryに含めない処理）。
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { firestorePaths } from '../../constants';
import type { Family } from '../../types/master';
import type { CarpoolRepository } from '../CarpoolRepository';

/** FirestoreのドキュメントスナップショットをFamily型へ変換する（Timestamp→Dateの変換を含む） */
function toFamily(d: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): Family {
  const data = d.data()!;
  return {
    id: d.id,
    familyName: data.familyName,
    vehicleCapacity: data.vehicleCapacity,
    pickupLocationId: data.pickupLocationId,
    isActive: data.isActive,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
}

export const familyRepository: Pick<
  CarpoolRepository,
  'createFamily' | 'getFamilies' | 'getFamily' | 'updateFamily' | 'deleteFamily' | 'restoreFamily'
> = {
  async createFamily(data) {
    const colRef = collection(db, firestorePaths.familiesCollection());
    const docRef = await addDoc(colRef, {
      ...data,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async getFamilies() {
    const colRef = collection(db, firestorePaths.familiesCollection());
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(toFamily);
  },

  async getFamily(familyId) {
    const docRef = doc(db, firestorePaths.familyDocument(familyId));
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    return toFamily(docSnap);
  },

  async updateFamily(familyId, data) {
    const docRef = doc(db, firestorePaths.familyDocument(familyId));
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteFamily(familyId) {
    const docRef = doc(db, firestorePaths.familyDocument(familyId));
    await deleteDoc(docRef);
  },

  async restoreFamily(family) {
    const docRef = doc(db, firestorePaths.familyDocument(family.id));
    await setDoc(docRef, {
      familyName: family.familyName,
      vehicleCapacity: family.vehicleCapacity,
      pickupLocationId: family.pickupLocationId,
      isActive: family.isActive,
      createdAt: Timestamp.fromDate(family.createdAt),
      updatedAt: Timestamp.fromDate(family.updatedAt),
    });
  },
};
