/**
 * バックアップファイル（書き出し/読み込み）のデータ形式
 * ref: docs/12_データバックアップ機能設計.md#4 バックアップファイルの形式
 */

import type { Family, Player, Coach, FamilyMember, PickupLocation, Destination } from './master';
import type { Event, Carpool } from './event';
import type { ResponseWithFamilyId } from '../services/event/responseService';

/** 現在のバックアップファイル形式のバージョン */
export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupData {
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  /** 書き出し日時（ISO8601） */
  exportedAt: string;
  pickupLocations: PickupLocation[];
  destinations: Destination[];
  families: Family[];
  players: Player[];
  coaches: Coach[];
  familyMembers: FamilyMember[];
  events: Array<
    Event & {
      responses: ResponseWithFamilyId[];
      carpools: Carpool[];
    }
  >;
}
