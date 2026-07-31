/**
 * 家庭名から車名を算出する（例：山田家→山田号）。
 * 運転者の家庭が削除済みで家庭名を解決できない場合（familyNameがnull）は「（削除済み）」を返す
 * （05_データ設計.md#12 削除方針）。
 */
export function toCarName(familyName: string | null): string {
  if (familyName === null) {
    return '（削除済み）';
  }
  return `${familyName.replace(/家$/, '')}号`;
}
