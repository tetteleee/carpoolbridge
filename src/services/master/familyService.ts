import type { Family } from '../../types/master';
import { repository } from '@repository';

/**
 * 家庭を新規登録します。
 * isActive は true、createdAt・updatedAt はサーバー時刻で自動設定されます。
 *
 * @param data 登録するデータ（id・isActive・createdAt・updatedAt を除くフィールド）
 * @returns 登録されたドキュメントのID
 */
export async function createFamily(
  data: Omit<Family, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  return repository.createFamily(data);
}

/**
 * 家庭の一覧を取得します。
 *
 * @returns 家庭の配列
 */
export async function getFamilies(): Promise<Family[]> {
  return repository.getFamilies();
}

/**
 * 家庭を1件取得します。
 *
 * @param familyId 取得対象のドキュメントID
 * @returns 家庭。ドキュメントが存在しない場合は null
 */
export async function getFamily(familyId: string): Promise<Family | null> {
  return repository.getFamily(familyId);
}

/**
 * 家庭の familyName・vehicleCapacity・pickupLocationId・isActive を更新します。
 * isActive を false にすることで論理削除（卒団・非表示扱い）、true に戻すことで在籍復帰を表します。
 * 更新時に updatedAt をサーバー時刻で更新します。
 *
 * isActive を false に更新しても、この家庭に属する選手・コーチ・家族の isActive は書き換えない
 * （各自の値をそのまま保持する）。除外判定は「家庭 isActive AND 本人 isActive」のAND条件で行う
 * （05_データ設計.md#3 Family参照）。
 *
 * @param familyId 更新対象のドキュメントID
 * @param data 更新するフィールド（部分更新可）
 */
export async function updateFamily(
  familyId: string,
  data: Partial<Pick<Family, 'familyName' | 'vehicleCapacity' | 'pickupLocationId' | 'isActive'>>
): Promise<void> {
  return repository.updateFamily(familyId, data);
}

/**
 * 家庭を物理削除します（登録ミスの取り消し用）。
 * 所属する選手・コーチ・家族も道連れで物理削除します。
 * 過去の回答・配車結果から参照中でも削除する（05_データ設計.md#12 削除方針）。
 *
 * @param familyId 削除対象のドキュメントID
 */
export async function deleteFamily(familyId: string): Promise<void> {
  await repository.deletePlayersByFamilyId(familyId);
  await repository.deleteCoachesByFamilyId(familyId);
  await repository.deleteFamilyMembersByFamilyId(familyId);
  await repository.deleteFamily(familyId);
}
