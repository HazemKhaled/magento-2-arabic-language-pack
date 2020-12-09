/**
 * get random item from an array
 *
 * @export
 * @template T
 * @param {T[]} [arr=[]]
 * @returns {T}
 */
export function arrayRandom<T>(arr: T[] = []): T {
  return arr ? arr[Math.floor(Math.random() * arr.length)] : null;
}
