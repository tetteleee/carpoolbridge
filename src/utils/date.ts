const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

/**
 * 今日の日付を "YYYY-MM-DD" 形式（ローカルタイムゾーン）で返します。
 */
export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * "YYYY-MM-DD" 形式の日付文字列を "M/D(曜)" 形式に変換します。
 *
 * @param dateString "YYYY-MM-DD" 形式の日付文字列
 */
export function formatDateWithWeekday(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return `${month}/${day}(${WEEKDAY_LABELS[date.getDay()]})`;
}
