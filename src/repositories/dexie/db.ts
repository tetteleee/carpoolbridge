/**
 * Dexie（IndexedDB）のデータベーススキーマ定義
 * ref: docs/10_DexieRepository実装設計.md#4 Dexieスキーマ設計
 *
 * Firestoreのサブコレクション構造（events/{eventId}/responses/{familyId}、
 * events/{eventId}/carpools/{carpoolId}）はIndexedDBに存在しないため、
 * それぞれ独立したフラットテーブルとしeventIdを外部キーとして持たせる。
 */

import Dexie, { type EntityTable, type Table } from 'dexie';
import type {
  Family,
  Player,
  Coach,
  FamilyMember,
  PickupLocation,
  Destination,
} from '../../types/master';
import type { Event, Response, Carpool } from '../../types/event';

/**
 * responsesテーブルのレコード型
 * FirestoreのドキュメントID（=familyId）に相当する情報をフィールドとして持たせる
 */
export interface ResponseRecord extends Response {
  eventId: string;
  familyId: string;
}

/**
 * carpoolsテーブルのレコード型
 * Firestoreのサブコレクション位置（=eventId）に相当する情報をフィールドとして持たせる
 */
export interface CarpoolRecord extends Carpool {
  eventId: string;
}

class CarpoolBridgeDB extends Dexie {
  families!: EntityTable<Family, 'id'>;
  players!: EntityTable<Player, 'id'>;
  coaches!: EntityTable<Coach, 'id'>;
  familyMembers!: EntityTable<FamilyMember, 'id'>;
  pickupLocations!: EntityTable<PickupLocation, 'id'>;
  destinations!: EntityTable<Destination, 'id'>;
  events!: EntityTable<Event, 'id'>;
  responses!: Table<ResponseRecord, [string, string]>;
  carpools!: EntityTable<CarpoolRecord, 'id'>;

  constructor() {
    super('carpoolbridge');
    this.version(1).stores({
      families: 'id, isActive',
      players: 'id, familyId, isActive',
      coaches: 'id, familyId, isActive',
      familyMembers: 'id, familyId, isActive',
      pickupLocations: 'id',
      destinations: 'id',
      events: 'id, date',
      responses: '[eventId+familyId], eventId',
      carpools: 'id, eventId, [eventId+direction]',
    });
  }
}

export const db = new CarpoolBridgeDB();
