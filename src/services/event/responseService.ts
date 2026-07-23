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

/**
 * 家庭IDを付与した回答（一覧取得時に使用）
 * ドキュメントIDがfamilyIdであるため、一覧では対応する家庭を識別できるように付与する
 */
export interface ResponseWithFamilyId extends Response {
  familyId: string;
}

/**
 * 回答を新規登録します。
 * ドキュメントIDはfamilyIdとなります（`events/{eventId}/responses/{familyId}`）。
 * 既にドキュメントが存在する場合は上書きされます。
 *
 * @param eventId 対象のイベントID
 * @param familyId 対象の家庭ID（ドキュメントIDとして使用）
 * @param data 登録する回答内容
 */
export async function createResponse(
  eventId: string,
  familyId: string,
  data: Response
): Promise<void> {
  const docRef = doc(db, firestorePaths.responseDocument(eventId, familyId));
  await setDoc(docRef, data);
}

/**
 * 登録済みの回答を更新します（UC-03 回答を修正する）。
 *
 * @param eventId 対象のイベントID
 * @param familyId 対象の家庭ID
 * @param data 更新するフィールド（部分更新可）
 */
export async function updateResponse(
  eventId: string,
  familyId: string,
  data: Partial<Response>
): Promise<void> {
  const docRef = doc(db, firestorePaths.responseDocument(eventId, familyId));
  await updateDoc(docRef, data);
}

/**
 * 指定イベント配下の回答一覧を取得します。
 * ドキュメントが存在しない家庭は含まれません（未回答の家庭は一覧に現れません）。
 *
 * @param eventId 対象のイベントID
 * @returns 回答の配列（各要素にfamilyIdを含む）
 */
export async function getResponses(eventId: string): Promise<ResponseWithFamilyId[]> {
  const colRef = collection(db, firestorePaths.responsesCollection(eventId));
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(
    (d) => ({ familyId: d.id, ...d.data() } as ResponseWithFamilyId)
  );
}

/**
 * 指定イベント・家庭の回答を1件取得します。
 *
 * @param eventId 対象のイベントID
 * @param familyId 対象の家庭ID
 * @returns 回答。ドキュメントが存在しない場合はnull
 */
export async function getResponse(
  eventId: string,
  familyId: string
): Promise<Response | null> {
  const docRef = doc(db, firestorePaths.responseDocument(eventId, familyId));
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null;
  }
  return docSnap.data() as Response;
}

/**
 * 対象家庭が「未回答」かどうかを判定します。
 * 設計上statusフィールドは持たないため、Responseドキュメントの存在有無のみで判定します。
 *
 * @param eventId 対象のイベントID
 * @param familyId 対象の家庭ID
 * @returns 未回答の場合true（ドキュメントが存在しない場合）
 */
export async function isUnanswered(eventId: string, familyId: string): Promise<boolean> {
  const docRef = doc(db, firestorePaths.responseDocument(eventId, familyId));
  const docSnap = await getDoc(docRef);
  return !docSnap.exists();
}

/**
 * 指定イベント配下の回答（Response）をすべて物理削除します。
 * 05_データ設計.md#11の例外（開発用「サンプル回答生成」機能）としてのみ利用する処理であり、
 * 開発環境限定の当該機能の確認ダイアログで「実行」が選択された場合にのみ呼び出す。
 *
 * @param eventId 対象のイベントID
 */
export async function deleteAllResponses(eventId: string): Promise<void> {
  const colRef = collection(db, firestorePaths.responsesCollection(eventId));
  const snapshot = await getDocs(colRef);
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
}
