/**
 * Carpool分のDexieRepository実装
 * ref: docs/10_DexieRepository実装設計.md#4,#5
 * ref: docs/08_公開版アーキテクチャ設計.md#6 saveCarpoolsの新設について
 */

import { db } from './db';
import type { CarpoolRepository } from '../CarpoolRepository';
import type { Carpool } from '../../types/event';
import { omit } from './omit';

export const carpoolRepository: Pick<
  CarpoolRepository,
  | 'createCarpool'
  | 'getCarpools'
  | 'getCarpool'
  | 'updateCarpool'
  | 'saveCarpools'
  | 'deleteAllCarpools'
  | 'deleteCarpool'
> = {
  async createCarpool(eventId, data) {
    const id = crypto.randomUUID();
    await db.carpools.add({ id, eventId, ...data });
    return id;
  },

  async getCarpools(eventId, direction) {
    const records = direction
      ? await db.carpools.where('[eventId+direction]').equals([eventId, direction]).toArray()
      : await db.carpools.where('eventId').equals(eventId).toArray();
    return records.map((record) => omit(record, ['eventId']) as Carpool);
  },

  async getCarpool(_eventId, carpoolId) {
    const record = await db.carpools.get(carpoolId);
    if (!record) {
      return null;
    }
    return omit(record, ['eventId']) as Carpool;
  },

  async updateCarpool(_eventId, carpoolId, data) {
    await db.carpools.update(carpoolId, data);
  },

  async saveCarpools(eventId, carpools) {
    if (carpools.length === 0) {
      return;
    }
    // upsertのみ。渡された配列に含まれないCarpoolレコードには一切手を触れない
    // （ref: docs/08_公開版アーキテクチャ設計.md#6）。トランザクションで一括putし、
    // 一部だけ成功して乗客がどの車にも属さない状態になることを防ぐ。
    await db.transaction('rw', db.carpools, async () => {
      for (const carpool of carpools) {
        await db.carpools.put({ eventId, ...carpool });
      }
    });
  },

  async deleteAllCarpools(eventId) {
    await db.carpools.where('eventId').equals(eventId).delete();
  },

  async deleteCarpool(_eventId, carpoolId) {
    await db.carpools.delete(carpoolId);
  },
};
