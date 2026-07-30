/**
 * 未配車エリア・車カードにおける、乗車メンバーの集合場所グルーピング処理
 * ref: docs/04_画面設計.md#8 集合場所グルーピング
 */

import type { PersonCardData } from '../../components/carpool/PersonCard';

/** 集合場所ID単位でグルーピングされた乗車メンバー */
export interface LocationMemberGroup {
  /** 集合場所ID（PersonCardData.pickupLocationId） */
  locationId: string;
  /** グループ見出しに表示する集合場所名 */
  locationName: string;
  /** この集合場所に属する乗車メンバー（学年降順→名前順に整列済み） */
  members: PersonCardData[];
}

/**
 * PersonCardData.grade（useCarpoolBoardData.tsのtoGradeLabelが生成する「小1」〜「小6」形式、
 * 対象学年外はnull）を、ソート用の数値へ戻す。この文字列形式は同関数のみが生成する
 * 固定フォーマットのため、パースは安全である。
 */
function parseGradeNumber(grade: string | null): number | null {
  return grade === null ? null : Number(grade.slice(1));
}

/**
 * グループ内の並び順：学年降順（小6→小1）、学年なし（コーチ等）は最後、
 * 同学年は名前順（localeCompare('ja')）。
 * ref: src/pages/EventEditPage.tsxの家庭カード並び順（getFamilyHighestGrade）と同じ規則
 */
function compareMembers(a: PersonCardData, b: PersonCardData): number {
  const gradeA = parseGradeNumber(a.grade);
  const gradeB = parseGradeNumber(b.grade);
  if (gradeA !== gradeB) {
    if (gradeA === null) return 1;
    if (gradeB === null) return -1;
    return gradeB - gradeA;
  }
  return a.name.localeCompare(b.name, 'ja');
}

/**
 * 乗車メンバーを集合場所（pickupLocationId）単位でグルーピングする。
 * グループの並び順はmembers配列内での初出順（再ソートしない）。
 * グループ内の並び順はcompareMembersに従う。
 */
export function groupMembersByLocation(members: PersonCardData[]): LocationMemberGroup[] {
  const groups = new Map<string, LocationMemberGroup>();

  for (const member of members) {
    const locationId = member.pickupLocationId;
    let group = groups.get(locationId);
    if (!group) {
      group = { locationId, locationName: member.pickupLocationName, members: [] };
      groups.set(locationId, group);
    }
    group.members.push(member);
  }

  for (const group of groups.values()) {
    group.members.sort(compareMembers);
  }

  return Array.from(groups.values());
}
