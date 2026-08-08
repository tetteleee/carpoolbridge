/**
 * Event分のFirestoreRepository実装
 * ref: docs/08_公開版アーキテクチャ設計.md#5 CarpoolRepositoryインターフェース（ファイル構成）
 *
 * deleteEvent（回答・配車結果の道連れ削除を含むカスケード）はここでは単一ドキュメントの
 * 削除のみを行う。カスケード自体は services/event/eventService.ts 側の責務とする
 * （ref: docs/08_公開版アーキテクチャ設計.md#7 Repositoryに含めない処理）。
 */

import {
  collection,
  doc,
  documentId,
  addDoc,
  deleteDoc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { firestorePaths } from '../../constants';
import type { Event } from '../../types/event';
import type { CarpoolRepository } from '../CarpoolRepository';

/** 過去のイベント一覧を1ページで取得する件数 */
export const PAST_EVENTS_PAGE_SIZE = 20;

/** FirestoreのドキュメントスナップショットをEvent型へ変換する（Timestamp→Dateの変換を含む） */
function toEvent(d: QueryDocumentSnapshot<DocumentData>): Event {
  const data = d.data();
  return {
    id: d.id,
    name: data.name,
    date: data.date,
    destinationId: data.destinationId,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
}

export const eventRepository: Pick<
  CarpoolRepository,
  | 'createEvent'
  | 'getUpcomingEvents'
  | 'getPastEventsCount'
  | 'getPastEventsPage'
  | 'getEvent'
  | 'updateEvent'
  | 'deleteEvent'
> = {
  async createEvent(data) {
    const colRef = collection(db, firestorePaths.eventsCollection());
    const docRef = await addDoc(colRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async getUpcomingEvents(todayDate) {
    const colRef = collection(db, firestorePaths.eventsCollection());
    const q = query(colRef, where('date', '>=', todayDate), orderBy('date', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(toEvent);
  },

  async getPastEventsCount(todayDate) {
    const colRef = collection(db, firestorePaths.eventsCollection());
    const q = query(colRef, where('date', '<', todayDate));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  },

  async getPastEventsPage(todayDate, cursor) {
    const colRef = collection(db, firestorePaths.eventsCollection());
    const baseConstraints = [
      where('date', '<', todayDate),
      orderBy('date', 'desc'),
      orderBy(documentId(), 'desc'),
      limit(PAST_EVENTS_PAGE_SIZE + 1),
    ];
    const q = cursor
      ? query(colRef, ...baseConstraints, startAfter(cursor.date, cursor.id))
      : query(colRef, ...baseConstraints);
    const snapshot = await getDocs(q);
    const hasMore = snapshot.docs.length > PAST_EVENTS_PAGE_SIZE;
    const pageDocs = hasMore ? snapshot.docs.slice(0, PAST_EVENTS_PAGE_SIZE) : snapshot.docs;
    return {
      events: pageDocs.map(toEvent),
      hasMore,
    };
  },

  async getEvent(eventId) {
    const docRef = doc(db, firestorePaths.eventDocument(eventId));
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    return toEvent(docSnap);
  },

  async updateEvent(eventId, data) {
    const docRef = doc(db, firestorePaths.eventDocument(eventId));
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteEvent(eventId) {
    const docRef = doc(db, firestorePaths.eventDocument(eventId));
    await deleteDoc(docRef);
  },
};
