/**
 * FamilyMember分のDexieRepository実装
 * ref: docs/10_DexieRepository実装設計.md#5 影響範囲・タスク分割方針
 */

import { db } from './db';
import type { CarpoolRepository } from '../CarpoolRepository';

export const familyMemberRepository: Pick<
  CarpoolRepository,
  | 'createFamilyMember'
  | 'getFamilyMembersByFamilyId'
  | 'getAllFamilyMembers'
  | 'updateFamilyMember'
  | 'deleteFamilyMember'
  | 'deleteFamilyMembersByFamilyId'
> = {
  async createFamilyMember(data) {
    const id = crypto.randomUUID();
    await db.familyMembers.add({
      id,
      ...data,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return id;
  },

  async getFamilyMembersByFamilyId(familyId) {
    return db.familyMembers.where('familyId').equals(familyId).toArray();
  },

  async getAllFamilyMembers() {
    return db.familyMembers.toArray();
  },

  async updateFamilyMember(familyMemberId, data) {
    await db.familyMembers.update(familyMemberId, { ...data, updatedAt: new Date() });
  },

  async deleteFamilyMember(familyMemberId) {
    await db.familyMembers.delete(familyMemberId);
  },

  async deleteFamilyMembersByFamilyId(familyId) {
    await db.familyMembers.where('familyId').equals(familyId).delete();
  },
};
