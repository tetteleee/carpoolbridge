import type { Player } from '../../types/master';
import type { CarpoolRepository } from '../../repositories/CarpoolRepository';
import { firestoreRepository } from '../../repositories/firestore';

// firestoreRepositoryは全エンティティの実装が揃うまでPartial<CarpoolRepository>型のため、
// このファイルが実際に呼ぶPlayer関連メソッドは常に実装済みであることを踏まえてasで実体型に揃える
// （ref: docs/08_公開版アーキテクチャ設計.md#5 ファイル構成）。
const repository = firestoreRepository as CarpoolRepository;

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
  return repository.createPlayer(data);
}

/**
 * 指定した家庭に属する選手の一覧を取得します。
 *
 * @param familyId 対象の家庭ID
 * @returns 選手の配列
 */
export async function getPlayersByFamilyId(familyId: string): Promise<Player[]> {
  return repository.getPlayersByFamilyId(familyId);
}

/**
 * 全家庭分の選手を一括取得します。
 * 家庭ごとにgetPlayersByFamilyIdを呼ぶN+1クエリを避けるため、
 * 呼び出し側で家庭ID単位にグルーピングして使うことを想定する。
 *
 * @returns 選手の配列（全家庭分）
 */
export async function getAllPlayers(): Promise<Player[]> {
  return repository.getAllPlayers();
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
  return repository.updatePlayer(playerId, data);
}

/**
 * 選手を論理削除します（isActive を false に更新）。
 * ドキュメントは物理削除しません。
 *
 * @param playerId 削除対象のドキュメントID
 */
export async function deactivatePlayer(playerId: string): Promise<void> {
  return repository.deactivatePlayer(playerId);
}

/**
 * 選手を物理削除します（登録ミスの取り消し用）。
 * 過去の回答・配車結果から参照中でも削除する（05_データ設計.md#12 削除方針）。
 *
 * @param playerId 削除対象のドキュメントID
 */
export async function deletePlayer(playerId: string): Promise<void> {
  return repository.deletePlayer(playerId);
}

/**
 * 指定した家庭に属する選手を、全て物理削除します。
 * 家庭が削除された際に道連れで呼び出されます（05_データ設計.md#12 削除方針）。
 *
 * @param familyId 対象の家庭ID
 */
export async function deletePlayersByFamilyId(familyId: string): Promise<void> {
  return repository.deletePlayersByFamilyId(familyId);
}
