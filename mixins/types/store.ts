/**
 * Store Type definition
 *
 * @export
 * @interface Store
 */
export interface Store {
  currency: any;
  status: any;
  url: any;
  consumer_secret: any;
  consumer_key: any;
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
export interface StoreUser {}
