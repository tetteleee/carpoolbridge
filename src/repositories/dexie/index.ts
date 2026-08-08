/**
 * Dexie（IndexedDB）版のCarpoolRepository実装
 * ref: docs/10_DexieRepository実装設計.md#5 影響範囲・タスク分割方針（ファイル構成）
 *
 * 各エンティティの実装はエンティティ別ファイル（playerRepository.ts等）に追加し、
 * ここでスプレッドしてまとめる。未実装のエンティティが残っている間はPartial扱いとする。
 */

import type { CarpoolRepository } from '../CarpoolRepository';

export const dexieRepository: Partial<CarpoolRepository> = {};
