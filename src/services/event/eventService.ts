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
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { firestorePaths } from '../../constants';
import type { Event } from '../../types/event';

const DELETE_BATCH_SIZE = 400;

/** 過去のイベント一覧を1ページで取得する件数 */
export const PAST_EVENTS_PAGE_SIZE = 20;

/** 過去のイベントをページ取得する際のカーソル（直前ページ最後のイベント） */
export interface PastEventsCursor {
  date: string;
  id: string;
}

/** 過去のイベントのページ取得結果 */
export interface PastEventsPage {
  events: Event[];
  hasMore: boolean;
}

/** 指定コレクション配下の全ドキュメントを物理削除する */
async function deleteAllDocsInCollection(collectionPath: string): Promise<void> {
  const colRef = collection(db, collectionPath);
  const snapshot = await getDocs(colRef);
  const docs = snapshot.docs;

  for (let i = 0; i < docs.length; i += DELETE_BATCH_SIZE) {
    const batch = writeBatch(db);
    docs.slice(i, i + DELETE_BATCH_SIZE).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

/**
 * イベントを新規登録します。
 * createdAt・updatedAt はサーバー時刻で自動設定されます。
 *
 * @param data 登録するデータ（id・createdAt・updatedAt を除くフィールド）
 * @returns 登録されたドキュメントのID
 */
export async function createEvent(
  data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const colRef = collection(db, firestorePaths.eventsCollection());
  const docRef = await addDoc(colRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * 本日以降のイベントを日付昇順で取得します（ホーム画面上部に表示する分）。
 *
 * @param todayDate 本日の日付（"YYYY-MM-DD"）
 * @returns イベントの配列
 */
export async function getUpcomingEvents(todayDate: string): Promise<Event[]> {
  const colRef = collection(db, firestorePaths.eventsCollection());
  const q = query(colRef, where('date', '>=', todayDate), orderBy('date', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Event));
}

/**
 * 開催日を過ぎたイベントの件数のみを取得します（ホーム画面の
 * 「過去のイベント（n件）」表示用）。ドキュメント本体は取得しないため、
 * 件数が多くても読み取りコストは小さい。
 *
 * @param todayDate 本日の日付（"YYYY-MM-DD"）
 * @returns 過去のイベントの件数
 */
export async function getPastEventsCount(todayDate: string): Promise<number> {
  const colRef = collection(db, firestorePaths.eventsCollection());
  const q = query(colRef, where('date', '<', todayDate));
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

/**
 * 開催日を過ぎたイベントを、開催日が新しい順（今日に近い順）に
 * {@link PAST_EVENTS_PAGE_SIZE}件ずつページ取得します。
 * ホーム画面の「過去のイベント」展開・「もっと見る」で使用する。
 *
 * @param todayDate 本日の日付（"YYYY-MM-DD"）
 * @param cursor 前回取得した最後のイベント（date・id）。先頭ページを取得する場合はnull
 * @returns 取得したイベントと、さらに次ページが存在するかどうか
 */
export async function getPastEventsPage(
  todayDate: string,
  cursor: PastEventsCursor | null
): Promise<PastEventsPage> {
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
    events: pageDocs.map((d) => ({ id: d.id, ...d.data() } as Event)),
    hasMore,
  };
}

/**
 * イベントを1件取得します。
 *
 * @param eventId 取得対象のドキュメントID
 * @returns イベント。ドキュメントが存在しない場合は null
 */
export async function getEvent(eventId: string): Promise<Event | null> {
  const docRef = doc(db, firestorePaths.eventDocument(eventId));
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null;
  }
  return { id: docSnap.id, ...docSnap.data() } as Event;
}

/**
 * イベントのイベント名・日付・目的地を更新します。
 * Response（回答）データは対象外です。
 *
 * @param eventId 更新対象のドキュメントID
 * @param data 更新するフィールド（name・date・destinationId）
 */
export async function updateEvent(
  eventId: string,
  data: Pick<Event, 'name' | 'date' | 'destinationId'>
): Promise<void> {
  const docRef = doc(db, firestorePaths.eventDocument(eventId));
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * イベントを、配下の回答（Response）・配車結果（Carpool、行き・帰り両方向）ごと物理削除します。
 * クライアントSDKには再帰削除がないため、サブコレクションを先に削除してからイベント本体を削除する。
 * 復元手段は用意しない（05_データ設計.md#12 削除方針）。
 *
 * @param eventId 削除対象のドキュメントID
 */
export async function deleteEvent(eventId: string): Promise<void> {
  await deleteAllDocsInCollection(firestorePaths.responsesCollection(eventId));
  await deleteAllDocsInCollection(firestorePaths.carpoolsCollection(eventId));
  await deleteDoc(doc(db, firestorePaths.eventDocument(eventId)));
}
