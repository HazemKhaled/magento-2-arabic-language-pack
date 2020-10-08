import { IncomingMessage } from 'http';

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
  $endpoint: {
    action: {
      auth: string;
    };
  };
  $action: {
    auth: string[];
  };
}
