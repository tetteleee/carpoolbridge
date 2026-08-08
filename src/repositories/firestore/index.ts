/**
 * Firestore版のCarpoolRepository実装
 * ref: docs/08_公開版アーキテクチャ設計.md#5 CarpoolRepositoryインターフェース（ファイル構成）
 * ref: docs/10_DexieRepository実装設計.md#2 storageMode切り替え機構
 *
 * 各エンティティの実装はエンティティ別ファイル（familyRepository.ts等）に追加し、
 * ここでスプレッドしてまとめる。`@repository`エイリアス（vite.config.ts）経由で
 * importされ、自チーム版ビルドではこのファイルが解決先になる。
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
