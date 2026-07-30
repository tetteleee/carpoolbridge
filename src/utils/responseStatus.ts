import type { Response } from '../types/event';
import type { Player } from '../types/master';

/**
 * 家庭単位の回答状況（回答済み／一部回答／未回答）。
 * 05_データ設計.md#8「回答状況（回答済み／一部回答／未回答）」参照。
 */
export type ResponseStatus = 'answered' | 'partial' | 'unanswered';

/**
 * 家庭の回答状況（回答済み／一部回答／未回答）を判定する。
 * 判定対象は「車出し（driverOutward・driverReturn）」「全選手のisParticipating」
 * 「コーチが紐づく場合のみcoachParticipating」の3項目（該当時）。
 * capacityToday・remarksは既定値で成立するため判定対象に含めない。
 */
export function computeResponseStatus(
  response: Response,
  playerList: Player[],
  hasCoach: boolean
): ResponseStatus {
  const driverAnswered = response.driverOutward !== null && response.driverReturn !== null;
  const allPlayersAnswered = playerList.every((player) => {
    const responsePlayer = response.players.find((p) => p.playerId === player.id);
    return responsePlayer !== undefined && responsePlayer.isParticipating !== null;
  });

  const checks = [driverAnswered, allPlayersAnswered];
  if (hasCoach) {
    checks.push(response.coachParticipating !== null);
  }

  const answeredCount = checks.filter(Boolean).length;
  if (answeredCount === checks.length) return 'answered';
  if (answeredCount === 0) return 'unanswered';
  return 'partial';
}
