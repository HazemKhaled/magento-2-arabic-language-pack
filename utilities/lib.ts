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

export function html(
  strings: TemplateStringsArray,
  ...parts: string[]
): string {
  const head = parts[0];
  const body = parts[1];

  return `<!DOCTYPE html>
    <html lang="en">
    
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta http-equiv="X-UA-Compatible" content="ie=edge" />
      
      ${head}
    </head>
    
    <body>
      ${body}
    </body>
    
    </html>`;
}

export function renderCheckoutPage(initialState: unknown): string {
  const __state = JSON.stringify(initialState);
  const head = `
      <title>Knawat</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
      <link href="/style.css" rel="stylesheet"></head>
    `;
  const body = `
      <div id="app"><div class="spinner"></div></div>
      <script>window.__INITIAL_STATE__=${__state}</script>
      <script src="/app.js"></script>
    `;

  return html`<head>
      ${head}
    </head>
    <body>
      ${body}
    </body>`;
}
