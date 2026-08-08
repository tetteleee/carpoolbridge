/**
 * Coach分のDexieRepository実装
 * ref: docs/10_DexieRepository実装設計.md#5 影響範囲・タスク分割方針
 */

import { db } from './db';
import type { CarpoolRepository } from '../CarpoolRepository';

export const coachRepository: Pick<
  CarpoolRepository,
  | 'createCoach'
  | 'getCoachesByFamilyId'
  | 'getAllCoaches'
  | 'updateCoach'
  | 'deleteCoach'
  | 'deleteCoachesByFamilyId'
  | 'restoreCoach'
> = {
  async createCoach(data) {
    const id = crypto.randomUUID();
    await db.coaches.add({
      id,
      ...data,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return id;
  },

  async getCoachesByFamilyId(familyId) {
    return db.coaches.where('familyId').equals(familyId).toArray();
  },

  async getAllCoaches() {
    return db.coaches.toArray();
  },

  async updateCoach(coachId, data) {
    await db.coaches.update(coachId, { ...data, updatedAt: new Date() });
  },

  async deleteCoach(coachId) {
    await db.coaches.delete(coachId);
  },

  async deleteCoachesByFamilyId(familyId) {
    await db.coaches.where('familyId').equals(familyId).delete();
  },

  async restoreCoach(coach) {
    await db.coaches.put({ ...coach });
  },
};
