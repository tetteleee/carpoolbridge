import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { firestorePaths } from '../../constants';

/**
 * 匿名認証で取得したUIDが、Firestoreの staffUsers コレクションに登録されている（利用許可済み）か判定します。
 *
 * @param uid 判定対象のユーザーのUID
 * @returns 登録されている場合はtrue、登録されていない場合（およびエラー発生時）はfalse
 */
export async function checkStaffUserRegistration(uid: string): Promise<boolean> {
  const docPath = firestorePaths.staffUserDocument(uid);
  console.log("uid =", uid);
  console.log("path =", docPath);

  try {
    const docRef = doc(db, docPath);
    const docSnap = await getDoc(docRef);

    console.log("exists =", docSnap.exists());

    return docSnap.exists();
  } catch (e) {
    console.error(e);
    return false;
  }
}
