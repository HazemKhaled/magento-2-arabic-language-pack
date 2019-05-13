/**
 * Store Type definition
 *
 * @export
 * @interface Store
 */
export interface Store {
  currency: string;
  status: 'confirmed' | 'unconfirmed' | 'archived' | 'error';
  url: string;
  consumer_secret: string;
  consumer_key: string;
  sale_price: number;
  sale_price_operator: number;
  compared_at_price: number;
  compared_at_price_operator: number;
  users: StoreUser[];
}

/**
 * Store User
 *
 * @export
 * @interface StoreUser
 */
export interface StoreUser {
  email: string;
  roles: string[];
}
