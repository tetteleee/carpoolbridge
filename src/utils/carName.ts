/**
 * 家庭名から車名を算出する（例：山田家→山田号）。
 */
export function toCarName(familyName: string): string {
  return `${familyName.replace(/家$/, '')}号`;
}
