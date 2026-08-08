/**
 * Event分のDexieRepository実装
 * ref: docs/10_DexieRepository実装設計.md#4,#5
 *
 * deleteEvent（回答・配車結果の道連れ削除を含むカスケード）はここでは単一レコードの
 * 削除のみを行う。カスケード自体は services/event/eventService.ts 側の責務とする
 * （ref: docs/08_公開版アーキテクチャ設計.md#7 Repositoryに含めない処理）。
 *
 * getPastEventsPageは、Firestoreのような複合カーソルクエリがDexieにはないため、
 * 開催日を過ぎたイベントを全件取得したうえでメモリ上で(date降順, id降順)にソートし、
 * カーソル位置より後ろのみに絞り込んでからページ切り出しする。
 */

import { db } from './db';
import { PAST_EVENTS_PAGE_SIZE, type CarpoolRepository } from '../CarpoolRepository';
import type { Event } from '../../types/event';

/** (date降順, id降順)の並び順で比較する。Array.prototype.sortにそのまま渡せる */
function compareByDateDescThenIdDesc(a: Event, b: Event): number {
  if (a.date !== b.date) {
    return a.date < b.date ? 1 : -1;
  }
  return a.id < b.id ? 1 : -1;
}

export const eventRepository: Pick<
  CarpoolRepository,
  | 'createEvent'
  | 'getUpcomingEvents'
  | 'getPastEventsCount'
  | 'getPastEventsPage'
  | 'getEvent'
  | 'updateEvent'
  | 'deleteEvent'
> = {
  async createEvent(data) {
    const id = crypto.randomUUID();
    await db.events.add({
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return id;
  },

  async getUpcomingEvents(todayDate) {
    return db.events.where('date').aboveOrEqual(todayDate).sortBy('date');
  },

  async getPastEventsCount(todayDate) {
    return db.events.where('date').below(todayDate).count();
  },

  async getPastEventsPage(todayDate, cursor) {
    const pastEvents = await db.events.where('date').below(todayDate).toArray();
    const sorted = pastEvents.sort(compareByDateDescThenIdDesc);

    const afterCursor = cursor
      ? sorted.filter(
          (event) =>
            event.date < cursor.date || (event.date === cursor.date && event.id < cursor.id)
        )
      : sorted;

    const hasMore = afterCursor.length > PAST_EVENTS_PAGE_SIZE;
    const events = hasMore ? afterCursor.slice(0, PAST_EVENTS_PAGE_SIZE) : afterCursor;

    return { events, hasMore };
  },

  async getEvent(eventId) {
    const event = await db.events.get(eventId);
    return event ?? null;
  },

  async updateEvent(eventId, data) {
    await db.events.update(eventId, { ...data, updatedAt: new Date() });
  },

  async deleteEvent(eventId) {
    await db.events.delete(eventId);
  },
};
