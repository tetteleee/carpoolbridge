import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { firestorePaths } from '../../constants';
import type { Player } from '../../types/master';

/**
 * 選手を新規登録します。
 * isActive は true、createdAt・updatedAt はサーバー時刻で自動設定されます。
 *
 * @param data 登録するデータ（id・isActive・createdAt・updatedAt を除くフィールド）
 * @returns 登録されたドキュメントのID
 */
export async function createPlayer(
  data: Omit<Player, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const colRef = collection(db, firestorePaths.playersCollection());
  const docRef = await addDoc(colRef, {
    ...data,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * 指定した家庭に属する選手の一覧を取得します。
 *
 * @param familyId 対象の家庭ID
 * @returns 選手の配列
 */
export async function getPlayersByFamilyId(familyId: string): Promise<Player[]> {
  const colRef = collection(db, firestorePaths.playersCollection());
  const q = query(colRef, where('familyId', '==', familyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Player));
}

/**
 * 選手の name・schoolEntryYear・isActive を更新します。
 * 更新時に updatedAt をサーバー時刻で更新します。
 *
 * @param playerId 更新対象のドキュメントID
 * @param data 更新するフィールド（部分更新可）
 */
export async function updatePlayer(
  playerId: string,
  data: Partial<Pick<Player, 'name' | 'schoolEntryYear' | 'isActive'>>
): Promise<void> {
  const docRef = doc(db, firestorePaths.playerDocument(playerId));
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 選手を論理削除します（isActive を false に更新）。
 * ドキュメントは物理削除しません。
 *
 * @param playerId 削除対象のドキュメントID
 */
export async function deactivatePlayer(playerId: string): Promise<void> {
  const docRef = doc(db, firestorePaths.playerDocument(playerId));
  await updateDoc(docRef, {
    isActive: false,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 指定した家庭に属する在籍中の選手を、全て論理削除します（isActive を false に一括更新）。
 * 家庭が無効化された際に呼び出されます。
 *
 * @param familyId 対象の家庭ID
 */
export async function deactivatePlayersByFamilyId(familyId: string): Promise<void> {
  const colRef = collection(db, firestorePaths.playersCollection());
  const q = query(colRef, where('familyId', '==', familyId), where('isActive', '==', true));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return;
  }

  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => {
    batch.update(d.ref, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}
