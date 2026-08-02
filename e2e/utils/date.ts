/**
 * E2Eテスト実行日を基準に "YYYY-MM-DD" 形式の日付文字列を返す。
 * イベント日付を絶対値でハードコードすると、実行日がその日付を過ぎた際に
 * ホーム画面で「過去のイベント」扱いとなり折りたたまれてテストが壊れるため、
 * 「今日から何日後か」で指定できるようにする。
 *
 * @param offsetDays 今日からのオフセット日数（0なら今日）
 */
export function dateOffsetString(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
