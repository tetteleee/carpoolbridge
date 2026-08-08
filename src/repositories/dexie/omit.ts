/** objからkeysで指定したプロパティを除いた新しいオブジェクトを返す */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result: Partial<T> = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result as Omit<T, K>;
}
