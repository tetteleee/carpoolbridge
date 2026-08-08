/**
 * バックアップ読み込み専用の全データ削除（clearAllData）DexieRepository実装
 * ref: docs/12_データバックアップ機能設計.md#6 CarpoolRepositoryインターフェースの拡張
 *
 * IndexedDBはDB内であればテーブルをまたいだトランザクションが可能なため、
 * Firestore版と異なり途中失敗時に一部だけ削除された不完全な状態にならない。
 */

import { db } from './db';
import type { CarpoolRepository } from '../CarpoolRepository';

export const clearAllDataRepository: Pick<CarpoolRepository, 'clearAllData'> = {
  async clearAllData() {
    await db.transaction(
      'rw',
      [
        db.families,
        db.players,
        db.coaches,
        db.familyMembers,
        db.pickupLocations,
        db.destinations,
        db.events,
        db.responses,
        db.carpools,
      ],
      async () => {
        await Promise.all([
          db.families.clear(),
          db.players.clear(),
          db.coaches.clear(),
          db.familyMembers.clear(),
          db.pickupLocations.clear(),
          db.destinations.clear(),
          db.events.clear(),
          db.responses.clear(),
          db.carpools.clear(),
        ]);
      }
    );
  },
};
