import crypto from 'crypto';

import qs, { ParsedQs } from 'qs';
import { MoleculerRequest, Response, NextFunction } from 'moleculer-express';

import { Store } from '../types';
import { MpError } from '../adapters';

export function hmacMiddleware(): (
  req: MoleculerRequest,
  res: Response,
  next: NextFunction
) => Promise<void> {
  return async (
    req: MoleculerRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { query } = req;
    const { store: storeUrl, hmac } = query;

    try {
      if (!storeUrl || !hmac) {
        throw new MpError('HMAC Validation', 'Unprocessable Entity', 422);
      }
      const store: any = await req.$ctx.broker.call('stores.getOne', {
        id: storeUrl,
      });
      const isValid = validateKnawatHmac(query, store);

      if (!isValid) {
        throw new MpError('HMAC Validation', 'Unauthorized', 401);
      }
    } catch (error) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.writeHead(error.code);
      res.end(error.message);
      return;
    }

    next();
  };
}

/**
 * Validate Knawat hmac
 *
 */
function validateKnawatHmac(
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
