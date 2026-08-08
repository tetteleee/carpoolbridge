/**
 * PickupLocation分のFirestoreRepository実装
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
import type { PickupLocation } from '../../types/master';
import type { CarpoolRepository } from '../CarpoolRepository';

export const pickupLocationRepository: Pick<
  CarpoolRepository,
  | 'createPickupLocation'
  | 'getPickupLocations'
  | 'getPickupLocation'
  | 'updatePickupLocation'
  | 'deletePickupLocation'
  | 'restorePickupLocation'
> = {
  async createPickupLocation(data) {
    const colRef = collection(db, firestorePaths.pickupLocationsCollection());
    const docRef = await addDoc(colRef, data);
    return docRef.id;
  },

  async getPickupLocations() {
    const colRef = collection(db, firestorePaths.pickupLocationsCollection());
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PickupLocation));
  },

  async getPickupLocation(locationId) {
    const docRef = doc(db, firestorePaths.pickupLocationDocument(locationId));
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    return { id: docSnap.id, ...docSnap.data() } as PickupLocation;
  },

  async updatePickupLocation(locationId, data) {
    const docRef = doc(db, firestorePaths.pickupLocationDocument(locationId));
    await updateDoc(docRef, data);
  },

  async deletePickupLocation(locationId) {
    const docRef = doc(db, firestorePaths.pickupLocationDocument(locationId));
    await deleteDoc(docRef);
  },

  async restorePickupLocation(location) {
    const docRef = doc(db, firestorePaths.pickupLocationDocument(location.id));
    await setDoc(docRef, {
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
    });
  },
};
