import type { Destination } from '../../types/master';
import type { CarpoolRepository } from '../../repositories/CarpoolRepository';
import { firestoreRepository } from '../../repositories/firestore';

// firestoreRepositoryは全エンティティの実装が揃うまでPartial<CarpoolRepository>型のため、
// このファイルが実際に呼ぶDestination関連メソッドは常に実装済みであることを踏まえてasで
// 実体型に揃える（ref: docs/08_公開版アーキテクチャ設計.md#5 ファイル構成）。
const repository = firestoreRepository as CarpoolRepository;

/**
 * 目的地を新規登録します。
 *
 * @param data 登録するデータ（id を除くフィールド）
 * @returns 登録されたドキュメントのID
 */
export async function createDestination(
  data: Omit<Destination, 'id'>
): Promise<string> {
  return repository.createDestination(data);
}

/**
 * 目的地の一覧を取得します。
 *
 * @returns 目的地の配列
 */
export async function getDestinations(): Promise<Destination[]> {
  return repository.getDestinations();
}

/**
 * 目的地を1件取得します。
 *
 * @param destinationId 取得対象のドキュメントID
 * @returns 目的地。ドキュメントが存在しない場合は null
 */
export async function getDestination(
  destinationId: string
): Promise<Destination | null> {
  return repository.getDestination(destinationId);
}

/**
 * 目的地の name・latitude・longitude を更新します。
 *
 * @param destinationId 更新対象のドキュメントID
 * @param data 更新するフィールド（部分更新可）
 */
export async function updateDestination(
  destinationId: string,
  data: Partial<Pick<Destination, 'name' | 'latitude' | 'longitude'>>
): Promise<void> {
  return repository.updateDestination(destinationId, data);
}

/**
 * 目的地を物理削除します。
 * （Destination には isActive フィールドが存在しないため論理削除は行いません）
 *
 * @param destinationId 削除対象のドキュメントID
 */
export async function deleteDestination(destinationId: string): Promise<void> {
  return repository.deleteDestination(destinationId);
}
