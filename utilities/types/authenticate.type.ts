import { IncomingMessage } from 'http';

import { ActionSchema, Context, GenericObject } from 'moleculer';

import { Store } from './store.type';

/**
 *  Incoming Request Definition
 *
 * @exports
 * @interface IncomingRequest
 */
export interface IncomingRequest extends IncomingMessage {
  $params: GenericObject;
  $meta?: GenericObject;
  $endpoint: {
    action: {
      auth: string;
    };
  };
  $action: ActionSchema;
  $ctx: Context<
    unknown,
    {
      responseType: string;
      $responseHeaders: GenericObject;
      $statusCode: number;
    }
  >;
}

/**
 * MetaParams
 * @exports
 * @interface MetaParams
 */
export interface MetaParams {
  store?: Store;
  user?: string;
  storeId?: string;
  token?: string;
  $statusCode?: number;
  $statusMessage?: string;
  $responseType?: string;
}
