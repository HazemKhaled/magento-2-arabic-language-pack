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

/**
 * Wrapper for node-fetch
 * @param  {...any} args
 */
export function $fetch(url: string, ...args: any[]): Promise<any> {
  return fetch(url, ...args).then(async res => {
    const jsonRes = await res.json();
    if (res.ok) {
      return jsonRes;
    }
    throw {
      statusCode: res.status,
      ...jsonRes,
    };
  });
}
