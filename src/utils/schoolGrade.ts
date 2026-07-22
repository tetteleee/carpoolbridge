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
