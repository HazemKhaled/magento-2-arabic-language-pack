import { IncomingMessage } from 'http';

import { ActionSchema, Context, GenericObject } from 'moleculer';

import { Store } from './store.type';
/**
 * Authorize meta Type definition
 *
 * @export
 * @interface AuthorizeMeta
 */
export interface AuthorizeMeta {
  user: string;
  token: string;
  storeId: string;
  store: Store;
}

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
