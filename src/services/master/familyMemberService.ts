import type { FamilyMember } from '../../types/master';
import { repository } from '@repository';

/**
 * 家族を新規登録します。
 * isActive は true、createdAt・updatedAt はサーバー時刻で自動設定されます。
 *
 * @param data 登録するデータ（id・isActive・createdAt・updatedAt を除くフィールド）
 * @returns 登録されたドキュメントのID
 */
export async function createFamilyMember(
  data: Omit<FamilyMember, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  return repository.createFamilyMember(data);
}

/**
 * 指定した家庭に属する家族の一覧を取得します。
 *
 * @param familyId 対象の家庭ID
 * @returns 家族の配列
 */
export async function getFamilyMembersByFamilyId(familyId: string): Promise<FamilyMember[]> {
  return repository.getFamilyMembersByFamilyId(familyId);
}

/**
 * 全家庭分の家族を一括取得します。
 * 家庭ごとにgetFamilyMembersByFamilyIdを呼ぶN+1クエリを避けるため、
 * 呼び出し側で家庭ID単位にグルーピングして使うことを想定する。
 *
 * @returns 家族の配列（全家庭分）
 */
export async function getAllFamilyMembers(): Promise<FamilyMember[]> {
  return repository.getAllFamilyMembers();
}

/**
 * 家族の name・isActive を更新します。
 * 更新時に updatedAt をサーバー時刻で更新します。
 *
 * @param familyMemberId 更新対象のドキュメントID
 * @param data 更新するフィールド（部分更新可）
 */
export async function updateFamilyMember(
  familyMemberId: string,
  data: Partial<Pick<FamilyMember, 'name' | 'isActive'>>
): Promise<void> {
  return repository.updateFamilyMember(familyMemberId, data);
}

/**
 * 家族を物理削除します（登録ミスの取り消し用）。
 * 過去の回答・配車結果から参照中でも削除する（05_データ設計.md#12 削除方針）。
 *
 * @param familyMemberId 削除対象のドキュメントID
 */
export async function deleteFamilyMember(familyMemberId: string): Promise<void> {
  return repository.deleteFamilyMember(familyMemberId);
}

/**
 * 指定した家庭に属する家族を、全て物理削除します。
 * 家庭が削除された際に道連れで呼び出されます（05_データ設計.md#12 削除方針）。
 *
 * @param familyId 対象の家庭ID
 */
export async function deleteFamilyMembersByFamilyId(familyId: string): Promise<void> {
  return repository.deleteFamilyMembersByFamilyId(familyId);
}
