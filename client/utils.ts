/**
 * @param {*} val
 */
export function fixed2(val: number): string {
  if (isNaN(val)) {
    return '...';
  }
  return Number(val).toFixed(2);
}

export function round(number: number): number {
  return Math.round(number * 100) / 100;
}
