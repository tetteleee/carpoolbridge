import type { PickupLocation } from '../../types/master';
import { repository } from '@repository';

/**
 * 集合場所を新規登録します。
 *
 * @param data 登録するデータ（id を除くフィールド）
 * @returns 登録されたドキュメントのID
 */
export async function createPickupLocation(
  data: Omit<PickupLocation, 'id'>
): Promise<string> {
  return repository.createPickupLocation(data);
}

/**
 * 集合場所の一覧を取得します。
 *
 * @returns 集合場所の配列
 */
export async function getPickupLocations(): Promise<PickupLocation[]> {
  return repository.getPickupLocations();
}

/**
 * 集合場所を1件取得します。
 *
 * @param locationId 取得対象のドキュメントID
 * @returns 集合場所。ドキュメントが存在しない場合は null
 */
export async function getPickupLocation(
  locationId: string
): Promise<PickupLocation | null> {
  return repository.getPickupLocation(locationId);
}

/**
 * 集合場所の name・latitude・longitude を更新します。
 *
 * @param locationId 更新対象のドキュメントID
 * @param data 更新するフィールド（部分更新可）
 */
export async function updatePickupLocation(
  locationId: string,
  data: Partial<Pick<PickupLocation, 'name' | 'latitude' | 'longitude'>>
): Promise<void> {
  return repository.updatePickupLocation(locationId, data);
}

/**
 * 集合場所を物理削除します。
 * （PickupLocation には isActive フィールドが存在しないため論理削除は行いません）
 *
 * @param locationId 削除対象のドキュメントID
 */
export async function deletePickupLocation(locationId: string): Promise<void> {
  return repository.deletePickupLocation(locationId);
}
