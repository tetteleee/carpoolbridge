/**
 * データのバックアップ（書き出し・読み込み）
 * ref: docs/12_データバックアップ機能設計.md#5 インポート時の処理方針、#7 ビジネスロジック層
 *
 * 08_公開版アーキテクチャ設計.md#7の方針（複数のRepositoryプリミティブを組み合わせる
 * カスケード処理はRepositoryに含めず、service層に置く）に従い、
 * ストレージ非依存（Firestore・Dexie共通）の関数として実装する。
 */

import { repository } from '@repository';
import { getPickupLocations } from '../master/pickupLocationService';
import { getDestinations } from '../master/destinationService';
import { getFamilies } from '../master/familyService';
import { getAllPlayers } from '../master/playerService';
import { getAllCoaches } from '../master/coachService';
import { getAllFamilyMembers } from '../master/familyMemberService';
import { getUpcomingEvents, getPastEventsPage, type PastEventsCursor } from '../event/eventService';
import { getResponses } from '../event/responseService';
import { getCarpools } from '../event/carpoolService';
import { getTodayDateString } from '../../utils/date';
import { BACKUP_SCHEMA_VERSION, type BackupData } from '../../types/backup';
import type { Event } from '../../types/event';

/**
 * 登録済みの全データ（マスタ＋イベント履歴）を集めてバックアップ形式に組み立てる。
 */
export async function exportAllData(): Promise<BackupData> {
  const [pickupLocations, destinations, families, players, coaches, familyMembers] =
    await Promise.all([
      getPickupLocations(),
      getDestinations(),
      getFamilies(),
      getAllPlayers(),
      getAllCoaches(),
      getAllFamilyMembers(),
    ]);

  const today = getTodayDateString();
  const upcomingEvents = await getUpcomingEvents(today);

  const pastEvents: Event[] = [];
  let cursor: PastEventsCursor | null = null;
  let hasMore = true;
  while (hasMore) {
    const page = await getPastEventsPage(today, cursor);
    pastEvents.push(...page.events);
    hasMore = page.hasMore && page.events.length > 0;
    if (hasMore) {
      const last = page.events[page.events.length - 1];
      cursor = { date: last.date, id: last.id };
    }
  }

  const events = await Promise.all(
    [...upcomingEvents, ...pastEvents].map(async (event) => {
      const [responses, carpools] = await Promise.all([
        getResponses(event.id),
        getCarpools(event.id),
      ]);
      return { ...event, responses, carpools };
    })
  );

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    pickupLocations,
    destinations,
    families,
    players,
    coaches,
    familyMembers,
    events,
  };
}

/**
 * バックアップファイルの内容で、現在保存されている全データを置き換える（全置換）。
 * `data.schemaVersion`が対応バージョンと異なる場合は、データを一切変更せずエラーを投げる。
 */
export async function importAllData(data: BackupData): Promise<void> {
  if (data.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error('対応していないバックアップファイルの形式です');
  }

  await repository.clearAllData();

  for (const location of data.pickupLocations) {
    await repository.restorePickupLocation(location);
  }
  for (const destination of data.destinations) {
    await repository.restoreDestination(destination);
  }
  for (const family of data.families) {
    await repository.restoreFamily(family);
  }
  for (const player of data.players) {
    await repository.restorePlayer(player);
  }
  for (const coach of data.coaches) {
    await repository.restoreCoach(coach);
  }
  for (const familyMember of data.familyMembers) {
    await repository.restoreFamilyMember(familyMember);
  }
  for (const event of data.events) {
    const { responses, carpools, ...eventData } = event;
    await repository.restoreEvent(eventData);
    for (const response of responses) {
      const { familyId, ...responseData } = response;
      await repository.createResponse(eventData.id, familyId, responseData);
    }
    await repository.saveCarpools(eventData.id, carpools);
  }
}
