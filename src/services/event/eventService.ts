import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { firestorePaths } from '../../constants';
import type { Event } from '../../types/event';

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
 * イベントの一覧を取得します。
 *
 * @returns イベントの配列
 */
export async function getEvents(): Promise<Event[]> {
  const colRef = collection(db, firestorePaths.eventsCollection());
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Event));
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
