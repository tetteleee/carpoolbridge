import type { Response } from '../types/event';
import type { Player, Coach, FamilyMember } from '../types/master';

/**
 * 家庭単位の回答状況（回答済み／一部回答／未回答）。
 * 05_データ設計.md#9「回答状況（回答済み／一部回答／未回答）」参照。
 */
export type ResponseStatus = 'answered' | 'partial' | 'unanswered';

/**
 * 家庭の回答状況（回答済み／一部回答／未回答）を判定する。
 * 判定対象は「車出し（driverOutward・driverReturn）」「全選手のisParticipating」
 * 「コーチが1人以上登録されている場合のみ全コーチのisParticipating」
 * 「家族が1人以上登録されている場合のみ全家族のisParticipating」の各項目（該当時）。
 * capacityToday・remarksは既定値で成立するため判定対象に含めない。
 */
export function computeResponseStatus(
  response: Response,
  playerList: Player[],
  coachList: Coach[] = [],
  familyMemberList: FamilyMember[] = []
): ResponseStatus {
  const driverAnswered = response.driverOutward !== null && response.driverReturn !== null;
  const allPlayersAnswered = playerList.every((player) => {
    const responsePlayer = response.players.find((p) => p.playerId === player.id);
    return responsePlayer !== undefined && responsePlayer.isParticipating !== null;
  });

  const checks = [driverAnswered, allPlayersAnswered];
  if (coachList.length > 0) {
    const allCoachesAnswered = coachList.every((coach) => {
      const responseCoach = (response.coaches ?? []).find((c) => c.coachId === coach.id);
      return responseCoach !== undefined && responseCoach.isParticipating !== null;
    });
    checks.push(allCoachesAnswered);
  }
  if (familyMemberList.length > 0) {
    const allFamilyMembersAnswered = familyMemberList.every((familyMember) => {
      const responseFamilyMember = (response.familyMembers ?? []).find(
        (f) => f.familyMemberId === familyMember.id
      );
      return responseFamilyMember !== undefined && responseFamilyMember.isParticipating !== null;
    });
    checks.push(allFamilyMembersAnswered);
  }

  const answeredCount = checks.filter(Boolean).length;
  if (answeredCount === checks.length) return 'answered';
  if (answeredCount === 0) return 'unanswered';
  return 'partial';
}
