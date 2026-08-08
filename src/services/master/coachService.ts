import type { Coach } from '../../types/master';
import { repository } from '@repository';

/**
 * コーチを新規登録します。
 * isActive は true、createdAt・updatedAt はサーバー時刻で自動設定されます。
 *
 * @param data 登録するデータ（id・isActive・createdAt・updatedAt を除くフィールド）
 * @returns 登録されたドキュメントのID
 */
export async function createCoach(
  data: Omit<Coach, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  return repository.createCoach(data);
}

/**
 * 指定した家庭に属するコーチの一覧を取得します。
 *
 * @param familyId 対象の家庭ID
 * @returns コーチの配列
 */
export async function getCoachesByFamilyId(familyId: string): Promise<Coach[]> {
  return repository.getCoachesByFamilyId(familyId);
}

/**
 * 全家庭分のコーチを一括取得します。
 * 家庭ごとにgetCoachesByFamilyIdを呼ぶN+1クエリを避けるため、
 * 呼び出し側で家庭ID単位にグルーピングして使うことを想定する。
 *
 * @returns コーチの配列（全家庭分）
 */
export async function getAllCoaches(): Promise<Coach[]> {
  return repository.getAllCoaches();
}

/**
 * コーチの name・isActive を更新します。
 * 更新時に updatedAt をサーバー時刻で更新します。
 *
 * @param coachId 更新対象のドキュメントID
 * @param data 更新するフィールド（部分更新可）
 */
export async function updateCoach(
  coachId: string,
  data: Partial<Pick<Coach, 'name' | 'isActive'>>
): Promise<void> {
  return repository.updateCoach(coachId, data);
}

/**
 * コーチを物理削除します（登録ミスの取り消し用）。
 * 過去の回答・配車結果から参照中でも削除する（05_データ設計.md#12 削除方針）。
 *
 * @param coachId 削除対象のドキュメントID
 */
export async function deleteCoach(coachId: string): Promise<void> {
  return repository.deleteCoach(coachId);
}

/**
 * 指定した家庭に属するコーチを、全て物理削除します。
 * 家庭が削除された際に道連れで呼び出されます（05_データ設計.md#12 削除方針）。
 *
 * @param familyId 対象の家庭ID
 */
export async function deleteCoachesByFamilyId(familyId: string): Promise<void> {
  return repository.deleteCoachesByFamilyId(familyId);
}
