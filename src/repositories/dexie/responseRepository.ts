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
import { omit } from './omit';

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
