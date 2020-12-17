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
    // Try to get HTML or JSON data
    const parsedRes = await res.json().catch(() => res.text().catch(() => res));

    if (res.ok) {
      return parsedRes;
    }
    throw parsedRes;
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

/**
 * Debouncing
 *
 */
export function debounce(func: () => unknown, delay: number): () => unknown {
  let inDebounce: ReturnType<typeof setTimeout>;
  return function (): void {
    // eslint-disable-next-line prefer-rest-params
    const args = arguments;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    clearTimeout(inDebounce);
    inDebounce = setTimeout(() => func.apply(self, args), delay);
  };
}
