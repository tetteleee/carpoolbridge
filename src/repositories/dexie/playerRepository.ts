/**
 * Player分のDexieRepository実装
 * ref: docs/10_DexieRepository実装設計.md#5 影響範囲・タスク分割方針
 */

import { db } from './db';
import type { CarpoolRepository } from '../CarpoolRepository';

export const playerRepository: Pick<
  CarpoolRepository,
  | 'createPlayer'
  | 'getPlayersByFamilyId'
  | 'getAllPlayers'
  | 'updatePlayer'
  | 'deactivatePlayer'
  | 'deletePlayer'
  | 'deletePlayersByFamilyId'
  | 'restorePlayer'
> = {
  async createPlayer(data) {
    const id = crypto.randomUUID();
    await db.players.add({
      id,
      ...data,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return id;
  },

  async getPlayersByFamilyId(familyId) {
    return db.players.where('familyId').equals(familyId).toArray();
  },

  async getAllPlayers() {
    return db.players.toArray();
  },

  async updatePlayer(playerId, data) {
    await db.players.update(playerId, { ...data, updatedAt: new Date() });
  },

  async deactivatePlayer(playerId) {
    await db.players.update(playerId, { isActive: false, updatedAt: new Date() });
  },

  async deletePlayer(playerId) {
    await db.players.delete(playerId);
  },

  async deletePlayersByFamilyId(familyId) {
    await db.players.where('familyId').equals(familyId).delete();
  },

  async restorePlayer(player) {
    await db.players.put({ ...player });
  },
};
