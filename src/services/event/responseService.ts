import type { Response } from '../../types/event';
import type { CarpoolRepository } from '../../repositories/CarpoolRepository';
import { firestoreRepository } from '../../repositories/firestore';

// firestoreRepositoryは全エンティティの実装が揃うまでPartial<CarpoolRepository>型のため、
// このファイルが実際に呼ぶResponse関連メソッドは常に実装済みであることを踏まえてasで
// 実体型に揃える（ref: docs/08_公開版アーキテクチャ設計.md#5 ファイル構成）。
const repository = firestoreRepository as CarpoolRepository;

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
  return repository.createResponse(eventId, familyId, data);
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
  return repository.updateResponse(eventId, familyId, data);
}

/**
 * 指定イベント配下の回答一覧を取得します。
 * ドキュメントが存在しない家庭は含まれません（未回答の家庭は一覧に現れません）。
 *
 * @param eventId 対象のイベントID
 * @returns 回答の配列（各要素にfamilyIdを含む）
 */
export async function getResponses(eventId: string): Promise<ResponseWithFamilyId[]> {
  return repository.getResponses(eventId);
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
  return repository.getResponse(eventId, familyId);
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
  return repository.isUnanswered(eventId, familyId);
}

/**
 * 指定イベント配下の回答（Response）をすべて物理削除します。
 * 05_データ設計.md#12の例外（開発用「サンプル回答生成」機能）としてのみ利用する処理であり、
 * 開発環境限定の当該機能の確認ダイアログで「実行」が選択された場合にのみ呼び出す。
 *
 * @param eventId 対象のイベントID
 */
export async function deleteAllResponses(eventId: string): Promise<void> {
  return repository.deleteAllResponses(eventId);
}
