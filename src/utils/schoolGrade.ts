import type { Child } from '../types/master';

const ELEMENTARY_GRADE_COUNT = 6;

/**
 * 基準日が属する年度（4月始まり）を返す。
 */
export function getSchoolYear(referenceDate: Date = new Date()): number {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth() + 1;
  return month >= 4 ? year : year - 1;
}

/**
 * 入学年度から、基準日時点の学年（1〜6）を算出する。
 * 小学生の範囲外（未就学・卒業済み）の場合は null を返す。
 */
export function getSchoolGrade(
  schoolEntryYear: number,
  referenceDate: Date = new Date()
): number | null {
  const grade = getSchoolYear(referenceDate) - schoolEntryYear + 1;
  if (grade < 1 || grade > ELEMENTARY_GRADE_COUNT) {
    return null;
  }
  return grade;
}

/**
 * 入学年度選択肢の表示ラベル（例：2025年度(小2)）を返す。
 */
export function formatSchoolEntryYearLabel(
  schoolEntryYear: number,
  referenceDate: Date = new Date()
): string {
  const grade = getSchoolGrade(schoolEntryYear, referenceDate);
  const gradeLabel = grade === null ? '対象外' : `小${grade}`;
  return `${schoolEntryYear}年度(${gradeLabel})`;
}

/**
 * 入学年度の選択肢（小学1〜6年生に相当する年度）を返す。
 */
export function getSchoolEntryYearOptions(
  referenceDate: Date = new Date()
): number[] {
  const schoolYear = getSchoolYear(referenceDate);
  return Array.from(
    { length: ELEMENTARY_GRADE_COUNT },
    (_, i) => schoolYear - i
  );
}

/**
 * 家庭内の子供のうち最高学年（最も学年の高い子）を返す。
 * 対象学年（小1〜6）の子が1人もいない場合は null を返す。
 * 04_画面設計.md#7（回答編集画面の家庭カード並び順）で使用する。
 */
export function getFamilyHighestGrade(
  childList: Child[],
  referenceDate: Date = new Date()
): number | null {
  const grades = childList
    .map((child) => getSchoolGrade(child.schoolEntryYear, referenceDate))
    .filter((grade): grade is number => grade !== null);
  return grades.length > 0 ? Math.max(...grades) : null;
}
