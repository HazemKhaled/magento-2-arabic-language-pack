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
