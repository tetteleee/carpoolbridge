/**
 * Dexie（IndexedDB）版のCarpoolRepository実装
 * ref: docs/10_DexieRepository実装設計.md#2 storageMode切り替え機構
 * ref: docs/10_DexieRepository実装設計.md#5 影響範囲・タスク分割方針（ファイル構成）
 *
 * 各エンティティの実装はエンティティ別ファイル（playerRepository.ts等）に追加し、
 * ここでスプレッドしてまとめる。`@repository`エイリアス（vite.config.ts）経由で
 * importされ、公開版ビルド（--mode public）ではこのファイルが解決先になる。
 */

import type { CarpoolRepository } from '../CarpoolRepository';
import { playerRepository } from './playerRepository';
import { coachRepository } from './coachRepository';
import { familyMemberRepository } from './familyMemberRepository';
import { familyRepository } from './familyRepository';
import { pickupLocationRepository } from './pickupLocationRepository';
import { destinationRepository } from './destinationRepository';
import { responseRepository } from './responseRepository';
import { carpoolRepository } from './carpoolRepository';
import { eventRepository } from './eventRepository';
import { clearAllDataRepository } from './clearAllData';

export const repository: CarpoolRepository = {
  ...playerRepository,
  ...coachRepository,
  ...familyMemberRepository,
  ...familyRepository,
  ...pickupLocationRepository,
  ...destinationRepository,
  ...responseRepository,
  ...carpoolRepository,
  ...eventRepository,
  ...clearAllDataRepository,
};
