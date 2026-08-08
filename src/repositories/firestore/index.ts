/**
 * Firestore版のCarpoolRepository実装
 * ref: docs/08_公開版アーキテクチャ設計.md#5 CarpoolRepositoryインターフェース（ファイル構成）
 *
 * 各エンティティの実装はエンティティ別ファイル（familyRepository.ts等）に追加し、
 * ここでスプレッドしてまとめる。未実装のエンティティが残っている間はPartial扱いとする。
 */

import type { CarpoolRepository } from '../CarpoolRepository';
import { playerRepository } from './playerRepository';
import { coachRepository } from './coachRepository';
import { familyMemberRepository } from './familyMemberRepository';
import { familyRepository } from './familyRepository';
import { pickupLocationRepository } from './pickupLocationRepository';
import { destinationRepository } from './destinationRepository';

export const firestoreRepository: Partial<CarpoolRepository> = {
  ...playerRepository,
  ...coachRepository,
  ...familyMemberRepository,
  ...familyRepository,
  ...pickupLocationRepository,
  ...destinationRepository,
};
