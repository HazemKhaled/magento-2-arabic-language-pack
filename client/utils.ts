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

/**
 * get data
 * @param {array|string} data
 */
function getDataRecursive(data: unknown): string | unknown {
  if (!data) return '';
  if (Array.isArray(data)) {
    return data
      .map(({ message, data }) => {
        return `${message}\n${getDataRecursive(data)}`;
      })
      .join('\n');
  }
  return data;
}

/**
 * get error messages
 * @param {*} errObj
 */
export function getErrorMessage(errObj: {
  errors?: { message: string }[];
  message?: string;
  data?: string;
}): string {
  if (errObj.errors) {
    return getDataRecursive(errObj.errors) as string;
  }
  return errObj.message || errObj.data || 'unknown error';
}
