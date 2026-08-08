/**
 * Player分のFirestoreRepository実装
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
import type { Player } from '../../types/master';
import type { CarpoolRepository } from '../CarpoolRepository';

/** FirestoreのドキュメントスナップショットをPlayer型へ変換する（Timestamp→Dateの変換を含む） */
function toPlayer(d: QueryDocumentSnapshot<DocumentData>): Player {
  const data = d.data();
  return {
    id: d.id,
    familyId: data.familyId,
    name: data.name,
    schoolEntryYear: data.schoolEntryYear,
    isActive: data.isActive,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
}

export const playerRepository: Pick<
  CarpoolRepository,
  | 'createPlayer'
  | 'getPlayersByFamilyId'
  | 'getAllPlayers'
  | 'updatePlayer'
  | 'deactivatePlayer'
  | 'deletePlayer'
  | 'deletePlayersByFamilyId'
> = {
  async createPlayer(data) {
    const colRef = collection(db, firestorePaths.playersCollection());
    const docRef = await addDoc(colRef, {
      ...data,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async getPlayersByFamilyId(familyId) {
    const colRef = collection(db, firestorePaths.playersCollection());
    const q = query(colRef, where('familyId', '==', familyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(toPlayer);
  },

  async getAllPlayers() {
    const colRef = collection(db, firestorePaths.playersCollection());
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(toPlayer);
  },

  async updatePlayer(playerId, data) {
    const docRef = doc(db, firestorePaths.playerDocument(playerId));
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async deactivatePlayer(playerId) {
    const docRef = doc(db, firestorePaths.playerDocument(playerId));
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  },

  async deletePlayer(playerId) {
    const docRef = doc(db, firestorePaths.playerDocument(playerId));
    await deleteDoc(docRef);
  },

  async deletePlayersByFamilyId(familyId) {
    const colRef = collection(db, firestorePaths.playersCollection());
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
