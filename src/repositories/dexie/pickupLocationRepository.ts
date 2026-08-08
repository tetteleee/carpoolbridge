/**
 * PickupLocation分のDexieRepository実装
 * ref: docs/10_DexieRepository実装設計.md#5 影響範囲・タスク分割方針
 */

import { db } from './db';
import type { CarpoolRepository } from '../CarpoolRepository';

export const pickupLocationRepository: Pick<
  CarpoolRepository,
  | 'createPickupLocation'
  | 'getPickupLocations'
  | 'getPickupLocation'
  | 'updatePickupLocation'
  | 'deletePickupLocation'
  | 'restorePickupLocation'
> = {
  async createPickupLocation(data) {
    const id = crypto.randomUUID();
    await db.pickupLocations.add({ id, ...data });
    return id;
  },

  async getPickupLocations() {
    return db.pickupLocations.toArray();
  },

  async getPickupLocation(locationId) {
    const location = await db.pickupLocations.get(locationId);
    return location ?? null;
  },

  async updatePickupLocation(locationId, data) {
    await db.pickupLocations.update(locationId, data);
  },

  async deletePickupLocation(locationId) {
    await db.pickupLocations.delete(locationId);
  },

  async restorePickupLocation(location) {
    await db.pickupLocations.put({ ...location });
  },
};
