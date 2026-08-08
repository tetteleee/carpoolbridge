/**
 * Destination分のDexieRepository実装
 * ref: docs/10_DexieRepository実装設計.md#5 影響範囲・タスク分割方針
 */

import { db } from './db';
import type { CarpoolRepository } from '../CarpoolRepository';

export const destinationRepository: Pick<
  CarpoolRepository,
  | 'createDestination'
  | 'getDestinations'
  | 'getDestination'
  | 'updateDestination'
  | 'deleteDestination'
> = {
  async createDestination(data) {
    const id = crypto.randomUUID();
    await db.destinations.add({ id, ...data });
    return id;
  },

  async getDestinations() {
    return db.destinations.toArray();
  },

  async getDestination(destinationId) {
    const destination = await db.destinations.get(destinationId);
    return destination ?? null;
  },

  async updateDestination(destinationId, data) {
    await db.destinations.update(destinationId, data);
  },

  async deleteDestination(destinationId) {
    await db.destinations.delete(destinationId);
  },
};
