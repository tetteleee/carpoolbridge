/**
 * Firestore版のCarpoolRepository実装
 * ref: docs/08_公開版アーキテクチャ設計.md#5 CarpoolRepositoryインターフェース（ファイル構成）
 *
 * 各エンティティの実装はエンティティ別ファイル（familyRepository.ts等）に追加し、
 * ここでスプレッドしてまとめる。現時点（T67）では空の器のみで、中身はT68以降で追加していく。
 */

import type { CarpoolRepository } from '../CarpoolRepository';

export const firestoreRepository: Partial<CarpoolRepository> = {};
