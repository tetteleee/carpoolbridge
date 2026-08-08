/**
 * Response分のFirestoreRepository実装
 * ref: docs/08_公開版アーキテクチャ設計.md#5 CarpoolRepositoryインターフェース（ファイル構成）
 */

import {
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { firestorePaths } from '../../constants';
import type { Response } from '../../types/event';
import type { CarpoolRepository } from '../CarpoolRepository';
import type { ResponseWithFamilyId } from '../../services/event/responseService';

export const responseRepository: Pick<
  CarpoolRepository,
  | 'createResponse'
  | 'updateResponse'
  | 'getResponses'
  | 'getResponse'
  | 'isUnanswered'
  | 'deleteAllResponses'
> = {
  async createResponse(eventId, familyId, data) {
    const docRef = doc(db, firestorePaths.responseDocument(eventId, familyId));
    await setDoc(docRef, data);
  },

  async updateResponse(eventId, familyId, data) {
    const docRef = doc(db, firestorePaths.responseDocument(eventId, familyId));
    await updateDoc(docRef, data);
  },

  async getResponses(eventId) {
    const colRef = collection(db, firestorePaths.responsesCollection(eventId));
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(
      (d) => ({ familyId: d.id, ...d.data() } as ResponseWithFamilyId)
    );
  },

  async getResponse(eventId, familyId) {
    const docRef = doc(db, firestorePaths.responseDocument(eventId, familyId));
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    return docSnap.data() as Response;
  },

  async isUnanswered(eventId, familyId) {
    const docRef = doc(db, firestorePaths.responseDocument(eventId, familyId));
    const docSnap = await getDoc(docRef);
    return !docSnap.exists();
  },

  async deleteAllResponses(eventId) {
    const colRef = collection(db, firestorePaths.responsesCollection(eventId));
    const snapshot = await getDocs(colRef);
    await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
  },
};
