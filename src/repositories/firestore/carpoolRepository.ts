/**
 * Carpool分のFirestoreRepository実装
 * ref: docs/08_公開版アーキテクチャ設計.md#5 CarpoolRepositoryインターフェース（ファイル構成）
 * ref: docs/08_公開版アーキテクチャ設計.md#6 saveCarpoolsの新設について
 *
 * deleteCarpoolsByDirection（getCarpools→ループでdeleteCarpoolのカスケード）は
 * ここでは実装せず、services/event/carpoolService.ts側の責務とする
 * （ref: docs/08_公開版アーキテクチャ設計.md#7 Repositoryに含めない処理）。
 */

import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { firestorePaths } from '../../constants';
import type { Carpool } from '../../types/event';
import type { CarpoolRepository } from '../CarpoolRepository';

export const carpoolRepository: Pick<
  CarpoolRepository,
  | 'createCarpool'
  | 'getCarpools'
  | 'getCarpool'
  | 'updateCarpool'
  | 'saveCarpools'
  | 'deleteAllCarpools'
  | 'deleteCarpool'
> = {
  async createCarpool(eventId, data) {
    const colRef = collection(db, firestorePaths.carpoolsCollection(eventId));
    const docRef = await addDoc(colRef, data);
    return docRef.id;
  },

  async getCarpools(eventId, direction) {
    const colRef = collection(db, firestorePaths.carpoolsCollection(eventId));
    const queryRef = direction ? query(colRef, where('direction', '==', direction)) : colRef;
    const snapshot = await getDocs(queryRef);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Carpool));
  },

  async getCarpool(eventId, carpoolId) {
    const docRef = doc(db, firestorePaths.carpoolDocument(eventId, carpoolId));
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    return { id: docSnap.id, ...docSnap.data() } as Carpool;
  },

  async updateCarpool(eventId, carpoolId, data) {
    const docRef = doc(db, firestorePaths.carpoolDocument(eventId, carpoolId));
    await updateDoc(docRef, data);
  },

  async saveCarpools(eventId, carpools) {
    if (carpools.length === 0) {
      return;
    }
    const batch = writeBatch(db);
    carpools.forEach((carpool) => {
      const { id, ...data } = carpool;
      const docRef = doc(db, firestorePaths.carpoolDocument(eventId, id));
      batch.set(docRef, data);
    });
    await batch.commit();
  },

  async deleteAllCarpools(eventId) {
    const colRef = collection(db, firestorePaths.carpoolsCollection(eventId));
    const snapshot = await getDocs(colRef);
    await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
  },

  async deleteCarpool(eventId, carpoolId) {
    const docRef = doc(db, firestorePaths.carpoolDocument(eventId, carpoolId));
    await deleteDoc(docRef);
  },
};
