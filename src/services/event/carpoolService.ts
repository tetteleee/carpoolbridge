import type { Carpool, Direction } from '../../types/event';
import { repository } from '@repository';

/**
 * 配車結果（車ごとレコード）を新規登録します。
 * ドキュメントIDはFirestoreが自動採番します。
 *
 * @param eventId 対象のイベントID
 * @param data 登録するデータ（idを除くフィールド）
 * @returns 登録されたドキュメントのID
 */
export async function createCarpool(
  eventId: string,
  data: Omit<Carpool, 'id'>
): Promise<string> {
  return repository.createCarpool(eventId, data);
}

/**
 * 指定イベント配下の配車結果一覧を取得します。
 * directionを指定した場合はその方向のみに絞り込みます。
 *
 * @param eventId 対象のイベントID
 * @param direction 絞り込む方向（省略時は全件取得）
 * @returns 配車結果の配列
 */
export async function getCarpools(
  eventId: string,
  direction?: Direction
): Promise<Carpool[]> {
  return repository.getCarpools(eventId, direction);
}

/**
 * 指定イベント・配車結果を1件取得します。
 *
 * @param eventId 対象のイベントID
 * @param carpoolId 対象の配車結果ID
 * @returns 配車結果。ドキュメントが存在しない場合はnull
 */
export async function getCarpool(
  eventId: string,
  carpoolId: string
): Promise<Carpool | null> {
  return repository.getCarpool(eventId, carpoolId);
}

/**
 * 既存の配車結果を更新します。
 *
 * @param eventId 対象のイベントID
 * @param carpoolId 対象の配車結果ID
 * @param data 更新するフィールド（部分更新可）
 */
export async function updateCarpool(
  eventId: string,
  carpoolId: string,
  data: Partial<Omit<Carpool, 'id'>>
): Promise<void> {
  return repository.updateCarpool(eventId, carpoolId, data);
}

/**
 * 指定イベント配下の配車結果（行き・帰り両方向）をすべて物理削除します。
 * 05_データ設計.md#12の例外（配車再作成）としてのみ利用する処理であり、
 * 配車再作成の確認ダイアログで「再作成」が選択された場合にのみ呼び出す。
 *
 * @param eventId 対象のイベントID
 */
export async function deleteAllCarpools(eventId: string): Promise<void> {
  return repository.deleteAllCarpools(eventId);
}

/**
 * 指定イベント配下、指定方向の配車結果をすべて物理削除します。
 * 05_データ設計.md#12の例外（行き⇔帰りコピー）としてのみ利用する処理であり、
 * コピー先方向の配車結果を全置換する場合にのみ呼び出す。
 *
 * @param eventId 対象のイベントID
 * @param direction 削除対象の方向
 */
export async function deleteCarpoolsByDirection(
  eventId: string,
  direction: Direction
): Promise<void> {
  const carpools = await repository.getCarpools(eventId, direction);
  await Promise.all(carpools.map((carpool) => repository.deleteCarpool(eventId, carpool.id)));
}

/**
 * 配車結果を1件物理削除します。
 * 05_データ設計.md#12の例外（車出し可否変更に伴う自動整合）としてのみ利用する処理であり、
 * 車出し可否が可→不可に変わった家庭のCarpoolを削除する場合にのみ呼び出す。
 *
 * @param eventId 対象のイベントID
 * @param carpoolId 削除対象の配車結果ID
 */
export async function deleteCarpool(eventId: string, carpoolId: string): Promise<void> {
  return repository.deleteCarpool(eventId, carpoolId);
}
