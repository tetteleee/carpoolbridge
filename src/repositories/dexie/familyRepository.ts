/**
 * Family分のDexieRepository実装
 * ref: docs/10_DexieRepository実装設計.md#5 影響範囲・タスク分割方針
 *
 * deleteFamily はここでは単一レコードの削除のみを行う。選手・コーチ・家族の
 * 道連れ削除（カスケード）は services/master/familyService.ts 側の責務とする
 * （ref: docs/08_公開版アーキテクチャ設計.md#7 Repositoryに含めない処理）。
 */

import { db } from './db';
import type { CarpoolRepository } from '../CarpoolRepository';

export const familyRepository: Pick<
  CarpoolRepository,
  'createFamily' | 'getFamilies' | 'getFamily' | 'updateFamily' | 'deleteFamily' | 'restoreFamily'
> = {
  async createFamily(data) {
    const id = crypto.randomUUID();
    await db.families.add({
      id,
      ...data,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return id;
  },

  async getFamilies() {
    return db.families.toArray();
  },

  async getFamily(familyId) {
    const family = await db.families.get(familyId);
    return family ?? null;
  },

  async updateFamily(familyId, data) {
    await db.families.update(familyId, { ...data, updatedAt: new Date() });
  },

  async deleteFamily(familyId) {
    await db.families.delete(familyId);
  },

  async restoreFamily(family) {
    await db.families.put({ ...family });
  },
};
