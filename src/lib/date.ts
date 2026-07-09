const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function formatDateWithWeekday(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = WEEKDAYS[d.getDay()];
  return `${month}/${day}(${weekday})`;
}
