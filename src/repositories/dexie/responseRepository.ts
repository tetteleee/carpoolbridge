/**
 * Response分のDexieRepository実装
 * ref: docs/10_DexieRepository実装設計.md#4,#5
 *
 * Firestoreの events/{eventId}/responses/{familyId} は、Dexie側では
 * db.responses（複合主キー [eventId+familyId]）で表現する（ref: db.ts）。
 */

import { db } from './db';
import type { CarpoolRepository } from '../CarpoolRepository';
import type { Response } from '../../types/event';
import type { ResponseWithFamilyId } from '../../services/event/responseService';

/** objからkeysで指定したプロパティを除いた新しいオブジェクトを返す */
function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result: Partial<T> = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result as Omit<T, K>;
}

export const responseRepository: Pick<
  CarpoolRepository,
  | 'createResponse'
  | 'updateResponse'
  | 'getResponses'
  | 'getResponse'
  | 'isUnanswered'
  | 'deleteAllResponses'
> = {
  async createResponse(eventId, familyId, data) {
    // Firestoreのcreate(setDoc)と同じく、既存レコードがあれば上書きする
    await db.responses.put({ eventId, familyId, ...data });
  },

  async updateResponse(eventId, familyId, data) {
    await db.responses.update([eventId, familyId], data);
  },

  async getResponses(eventId) {
    const records = await db.responses.where('eventId').equals(eventId).toArray();
    return records.map((record) => omit(record, ['eventId']) as ResponseWithFamilyId);
  },

  async getResponse(eventId, familyId) {
    const record = await db.responses.get([eventId, familyId]);
    if (!record) {
      return null;
    }
    return omit(record, ['eventId', 'familyId']) as Response;
  },

  async isUnanswered(eventId, familyId) {
    const record = await db.responses.get([eventId, familyId]);
    return record === undefined;
  },

  async deleteAllResponses(eventId) {
    await db.responses.where('eventId').equals(eventId).delete();
  },
};
