import type { Event } from '../../types/event';
import type { CarpoolRepository } from '../../repositories/CarpoolRepository';
import { firestoreRepository } from '../../repositories/firestore';
import { PAST_EVENTS_PAGE_SIZE } from '../../repositories/firestore/eventRepository';

// firestoreRepositoryは全エンティティの実装が揃うまでPartial<CarpoolRepository>型のため、
// このファイルが実際に呼ぶメソッドは常に実装済みであることを踏まえてasで実体型に揃える
// （ref: docs/08_公開版アーキテクチャ設計.md#5 ファイル構成）。
const repository = firestoreRepository as CarpoolRepository;

/** 過去のイベント一覧を1ページで取得する件数 */
export { PAST_EVENTS_PAGE_SIZE };

/** 過去のイベントをページ取得する際のカーソル（直前ページ最後のイベント） */
export interface PastEventsCursor {
  date: string;
  id: string;
}

/** 過去のイベントのページ取得結果 */
export interface PastEventsPage {
  events: Event[];
  hasMore: boolean;
}

/**
 * イベントを新規登録します。
 * createdAt・updatedAt はサーバー時刻で自動設定されます。
 *
 * @param data 登録するデータ（id・createdAt・updatedAt を除くフィールド）
 * @returns 登録されたドキュメントのID
 */
export async function createEvent(
  data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  return repository.createEvent(data);
}

/**
 * 本日以降のイベントを日付昇順で取得します（ホーム画面上部に表示する分）。
 *
 * @param todayDate 本日の日付（"YYYY-MM-DD"）
 * @returns イベントの配列
 */
export async function getUpcomingEvents(todayDate: string): Promise<Event[]> {
  return repository.getUpcomingEvents(todayDate);
}

/**
 * 開催日を過ぎたイベントの件数のみを取得します（ホーム画面の
 * 「過去のイベント（n件）」表示用）。ドキュメント本体は取得しないため、
 * 件数が多くても読み取りコストは小さい。
 *
 * @param todayDate 本日の日付（"YYYY-MM-DD"）
 * @returns 過去のイベントの件数
 */
export async function getPastEventsCount(todayDate: string): Promise<number> {
  return repository.getPastEventsCount(todayDate);
}

/**
 * 開催日を過ぎたイベントを、開催日が新しい順（今日に近い順）に
 * {@link PAST_EVENTS_PAGE_SIZE}件ずつページ取得します。
 * ホーム画面の「過去のイベント」展開・「もっと見る」で使用する。
 *
 * @param todayDate 本日の日付（"YYYY-MM-DD"）
 * @param cursor 前回取得した最後のイベント（date・id）。先頭ページを取得する場合はnull
 * @returns 取得したイベントと、さらに次ページが存在するかどうか
 */
export async function getPastEventsPage(
  todayDate: string,
  cursor: PastEventsCursor | null
): Promise<PastEventsPage> {
  return repository.getPastEventsPage(todayDate, cursor);
}

/**
 * イベントを1件取得します。
 *
 * @param eventId 取得対象のドキュメントID
 * @returns イベント。ドキュメントが存在しない場合は null
 */
export async function getEvent(eventId: string): Promise<Event | null> {
  return repository.getEvent(eventId);
}

/**
 * イベントのイベント名・日付・目的地を更新します。
 * Response（回答）データは対象外です。
 *
 * @param eventId 更新対象のドキュメントID
 * @param data 更新するフィールド（name・date・destinationId）
 */
export async function updateEvent(
  eventId: string,
  data: Pick<Event, 'name' | 'date' | 'destinationId'>
): Promise<void> {
  return repository.updateEvent(eventId, data);
}

/**
 * イベントを、配下の回答（Response）・配車結果（Carpool、行き・帰り両方向）ごと物理削除します。
 * 復元手段は用意しない（05_データ設計.md#12 削除方針）。
 *
 * @param eventId 削除対象のドキュメントID
 */
export async function deleteEvent(eventId: string): Promise<void> {
  await repository.deleteAllResponses(eventId);
  await repository.deleteAllCarpools(eventId);
  await repository.deleteEvent(eventId);
}
