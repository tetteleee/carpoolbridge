/**
 * Dexie（IndexedDB）版のCarpoolRepository実装
 * ref: docs/10_DexieRepository実装設計.md#5 影響範囲・タスク分割方針（ファイル構成）
 *
 * 各エンティティの実装はエンティティ別ファイル（playerRepository.ts等）に追加し、
 * ここでスプレッドしてまとめる。未実装のエンティティが残っている間はPartial扱いとする。
 */

import type { CarpoolRepository } from '../CarpoolRepository';
import { playerRepository } from './playerRepository';
import { coachRepository } from './coachRepository';
import { familyMemberRepository } from './familyMemberRepository';
import { familyRepository } from './familyRepository';
import { pickupLocationRepository } from './pickupLocationRepository';
import { destinationRepository } from './destinationRepository';

export const dexieRepository: Partial<CarpoolRepository> = {
  ...playerRepository,
  ...coachRepository,
  ...familyMemberRepository,
  ...familyRepository,
  ...pickupLocationRepository,
  ...destinationRepository,
};
