/**
 * データ保存層の抽象化インターフェース
 * ref: docs/08_公開版アーキテクチャ設計.md#5 CarpoolRepositoryインターフェース
 *
 * 自チーム版（Firestore）・公開版（IndexedDB/Dexie.js）で共通して使う、
 * データ保存操作の型定義。既存のsrc/services/配下の関数名・シグネチャを踏襲する。
 */

import type { Family, Player, Coach, FamilyMember, PickupLocation, Destination } from '../types/master';
import type { Event, Response, Carpool, Direction } from '../types/event';
import type { PastEventsCursor, PastEventsPage } from '../services/event/eventService';
import type { ResponseWithFamilyId } from '../services/event/responseService';

/**
 * 過去のイベント一覧を1ページで取得する件数。
 * Firestore版・Dexie版どちらのgetPastEventsPage実装も参照する共通定数のため、
 * どちらの実装（repositories/firestore・repositories/dexie）にも依存しないここに置く
 * （services/event/eventService.tsが特定の実装を直接importしてしまうと、
 * @repositoryエイリアスによるビルド時の静的除外が効かなくなるため）。
 */
export const PAST_EVENTS_PAGE_SIZE = 20;

export interface CarpoolRepository {
  // --- Family ---
  createFamily(
    data: Omit<Family, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>
  ): Promise<string>;
  getFamilies(): Promise<Family[]>;
  getFamily(familyId: string): Promise<Family | null>;
  updateFamily(
    familyId: string,
    data: Partial<Pick<Family, 'familyName' | 'vehicleCapacity' | 'pickupLocationId' | 'isActive'>>
  ): Promise<void>;
  deleteFamily(familyId: string): Promise<void>; // 単一ドキュメント削除のみ（カスケードは各serviceファイル側で行う）
  /**
   * バックアップ読み込み専用。指定されたidでそのまま作成・上書きする（upsert）。
   * ref: docs/12_データバックアップ機能設計.md#6
   */
  restoreFamily(family: Family): Promise<void>;

  // --- Player ---
  createPlayer(
    data: Omit<Player, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>
  ): Promise<string>;
  getPlayersByFamilyId(familyId: string): Promise<Player[]>;
  getAllPlayers(): Promise<Player[]>;
  updatePlayer(
    playerId: string,
    data: Partial<Pick<Player, 'name' | 'schoolEntryYear' | 'isActive'>>
  ): Promise<void>;
  deactivatePlayer(playerId: string): Promise<void>;
  deletePlayer(playerId: string): Promise<void>;
  deletePlayersByFamilyId(familyId: string): Promise<void>;
  /**
   * バックアップ読み込み専用。指定されたidでそのまま作成・上書きする（upsert）。
   * ref: docs/12_データバックアップ機能設計.md#6
   */
  restorePlayer(player: Player): Promise<void>;

  // --- Coach ---
  createCoach(
    data: Omit<Coach, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>
  ): Promise<string>;
  getCoachesByFamilyId(familyId: string): Promise<Coach[]>;
  getAllCoaches(): Promise<Coach[]>;
  updateCoach(coachId: string, data: Partial<Pick<Coach, 'name' | 'isActive'>>): Promise<void>;
  deleteCoach(coachId: string): Promise<void>;
  deleteCoachesByFamilyId(familyId: string): Promise<void>;
  /**
   * バックアップ読み込み専用。指定されたidでそのまま作成・上書きする（upsert）。
   * ref: docs/12_データバックアップ機能設計.md#6
   */
  restoreCoach(coach: Coach): Promise<void>;

  // --- FamilyMember ---
  createFamilyMember(
    data: Omit<FamilyMember, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>
  ): Promise<string>;
  getFamilyMembersByFamilyId(familyId: string): Promise<FamilyMember[]>;
  getAllFamilyMembers(): Promise<FamilyMember[]>;
  updateFamilyMember(
    familyMemberId: string,
    data: Partial<Pick<FamilyMember, 'name' | 'isActive'>>
  ): Promise<void>;
  deleteFamilyMember(familyMemberId: string): Promise<void>;
  deleteFamilyMembersByFamilyId(familyId: string): Promise<void>;
  /**
   * バックアップ読み込み専用。指定されたidでそのまま作成・上書きする（upsert）。
   * ref: docs/12_データバックアップ機能設計.md#6
   */
  restoreFamilyMember(familyMember: FamilyMember): Promise<void>;

  // --- PickupLocation ---
  createPickupLocation(data: Omit<PickupLocation, 'id'>): Promise<string>;
  getPickupLocations(): Promise<PickupLocation[]>;
  getPickupLocation(locationId: string): Promise<PickupLocation | null>;
  updatePickupLocation(
    locationId: string,
    data: Partial<Pick<PickupLocation, 'name' | 'latitude' | 'longitude'>>
  ): Promise<void>;
  deletePickupLocation(locationId: string): Promise<void>;
  /**
   * バックアップ読み込み専用。指定されたidでそのまま作成・上書きする（upsert）。
   * ref: docs/12_データバックアップ機能設計.md#6
   */
  restorePickupLocation(location: PickupLocation): Promise<void>;

  // --- Destination ---
  createDestination(data: Omit<Destination, 'id'>): Promise<string>;
  getDestinations(): Promise<Destination[]>;
  getDestination(destinationId: string): Promise<Destination | null>;
  updateDestination(
    destinationId: string,
    data: Partial<Pick<Destination, 'name' | 'latitude' | 'longitude'>>
  ): Promise<void>;
  deleteDestination(destinationId: string): Promise<void>;
  /**
   * バックアップ読み込み専用。指定されたidでそのまま作成・上書きする（upsert）。
   * ref: docs/12_データバックアップ機能設計.md#6
   */
  restoreDestination(destination: Destination): Promise<void>;

  // --- Event ---
  createEvent(data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  getUpcomingEvents(todayDate: string): Promise<Event[]>;
  getPastEventsCount(todayDate: string): Promise<number>;
  getPastEventsPage(todayDate: string, cursor: PastEventsCursor | null): Promise<PastEventsPage>;
  getEvent(eventId: string): Promise<Event | null>;
  updateEvent(eventId: string, data: Pick<Event, 'name' | 'date' | 'destinationId'>): Promise<void>;
  deleteEvent(eventId: string): Promise<void>; // 単一ドキュメント削除のみ（カスケードは各serviceファイル側で行う）
  /**
   * バックアップ読み込み専用。指定されたidでそのまま作成・上書きする（upsert）。
   * ref: docs/12_データバックアップ機能設計.md#6
   */
  restoreEvent(event: Event): Promise<void>;

  // --- Response ---
  createResponse(eventId: string, familyId: string, data: Response): Promise<void>;
  updateResponse(eventId: string, familyId: string, data: Partial<Response>): Promise<void>;
  getResponses(eventId: string): Promise<ResponseWithFamilyId[]>;
  getResponse(eventId: string, familyId: string): Promise<Response | null>;
  isUnanswered(eventId: string, familyId: string): Promise<boolean>;
  deleteAllResponses(eventId: string): Promise<void>;

  // --- Carpool ---
  createCarpool(eventId: string, data: Omit<Carpool, 'id'>): Promise<string>;
  getCarpools(eventId: string, direction?: Direction): Promise<Carpool[]>;
  getCarpool(eventId: string, carpoolId: string): Promise<Carpool | null>;
  updateCarpool(eventId: string, carpoolId: string, data: Partial<Omit<Carpool, 'id'>>): Promise<void>;
  /**
   * 渡された配列の各要素をそれぞれcreate/updateする（upsertのみ）。
   * そのイベントの他のCarpoolドキュメントには一切手を触れない（削除しない）。
   * ref: docs/08_公開版アーキテクチャ設計.md#6 saveCarpoolsの新設について
   */
  saveCarpools(eventId: string, carpools: Carpool[]): Promise<void>;
  deleteAllCarpools(eventId: string): Promise<void>;
  deleteCarpool(eventId: string, carpoolId: string): Promise<void>;

  /**
   * バックアップ読み込み専用。families・players・coaches・familyMembers・
   * pickupLocations・destinations・events（配下のresponses・carpoolsを含む）を
   * 全件物理削除する。staffUsersは対象外。他の画面・機能から呼び出さないこと。
   * ref: docs/12_データバックアップ機能設計.md#6
   */
  clearAllData(): Promise<void>;
}
