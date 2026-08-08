/**
 * Destination分のFirestoreRepository実装
 * ref: docs/08_公開版アーキテクチャ設計.md#5 CarpoolRepositoryインターフェース（ファイル構成）
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
} from 'firebase/firestore';
import { db } from '../../firebase';
import { firestorePaths } from '../../constants';
import type { Destination } from '../../types/master';
import type { CarpoolRepository } from '../CarpoolRepository';

export const destinationRepository: Pick<
  CarpoolRepository,
  | 'createDestination'
  | 'getDestinations'
  | 'getDestination'
  | 'updateDestination'
  | 'deleteDestination'
  | 'restoreDestination'
> = {
  async createDestination(data) {
    const colRef = collection(db, firestorePaths.destinationsCollection());
    const docRef = await addDoc(colRef, data);
    return docRef.id;
  },

  async getDestinations() {
    const colRef = collection(db, firestorePaths.destinationsCollection());
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Destination));
  },

  async getDestination(destinationId) {
    const docRef = doc(db, firestorePaths.destinationDocument(destinationId));
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    return { id: docSnap.id, ...docSnap.data() } as Destination;
  },

  async updateDestination(destinationId, data) {
    const docRef = doc(db, firestorePaths.destinationDocument(destinationId));
    await updateDoc(docRef, data);
  },

  async deleteDestination(destinationId) {
    const docRef = doc(db, firestorePaths.destinationDocument(destinationId));
    await deleteDoc(docRef);
  },

  async restoreDestination(destination) {
    const docRef = doc(db, firestorePaths.destinationDocument(destination.id));
    await setDoc(docRef, {
      name: destination.name,
      latitude: destination.latitude,
      longitude: destination.longitude,
    });
  },
};
