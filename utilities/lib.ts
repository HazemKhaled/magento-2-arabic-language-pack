import crypto from 'crypto';

import qs, { ParsedQs } from 'qs';
import { MoleculerRequest } from 'moleculer-express';
import { Errors } from 'moleculer-web';
import { Context, GenericObject } from 'moleculer';

import { Store } from './types';

const {
  UnAuthorizedError,
  ERR_NO_TOKEN,
  ERR_INVALID_TOKEN,
  NotFoundError,
} = Errors;

export async function authorizeHmac(
  ctx: Context,
  req: MoleculerRequest
): Promise<void> {
  const { query, headers } = req;
  const { store: storeUrl, hmac } = query;

  if (!storeUrl || !hmac) {
    throw new UnAuthorizedError(ERR_NO_TOKEN, headers.authorization);
  }

  const store = await req.$ctx.broker.call('stores.sGet', { id: storeUrl });
  if (!store) {
    throw new NotFoundError('ERR_NOT_FOUND', headers.authorization);
  }

  const isValid = compareHmac(query, store);
  if (!isValid) {
    throw new UnAuthorizedError(ERR_INVALID_TOKEN, headers.authorization);
  }

  // Bind the store store into the meta data
  ctx.meta.store = store;
}

/**
 * Validate Knawat hmac
 *
 */
export function compareHmac(
  query: ParsedQs,
  { consumer_secret }: Store
): boolean {
  const { hmac } = query;

  const map = JSON.parse(JSON.stringify(query));
  delete map.hmac;

  const message = qs.stringify(map);
  const generatedHash = crypto
    .createHmac('sha256', consumer_secret)
    .update(message, 'utf8')
    .digest('hex');

  // log has in development mode
  if (process.env.NODE_ENV === 'development') {
    console.info('generatedHash', generatedHash);
  }

  return generatedHash === hmac;
}

/**
 * Sanitize date based on array of fields
 * @param fields
 * @param data
 */
export function sanitizeData(
  fields: string[],
  data: GenericObject
): GenericObject {
  return fields.reduce(
    (output: GenericObject, field: string): GenericObject => {
      if (data[field]) output[field] = data[field];
      return output;
    },
    {}
  );
}

/**
 * Encode the credit card number
 * @param number
 */
export function encodeCardNumber(number: string): string {
  const lastDigits = number.slice(-4);
  return `${'*'.repeat(4)} `.repeat(3) + lastDigits;
}
