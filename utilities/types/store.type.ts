import { Subscription } from "./user.type";

/**
 * Store Type definition
 *
 * @export
 * @interface Store
 */
export interface Store {
  _id: string;
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
  shipping_methods: ShippingMethod[];
  credit: number;
  debit: number;
  internal_data: { [key: string]: unknown };
  subscription?: Subscription;
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

/**
 * Shipment methods priority
 *
 * @export
 * @interface ShippingMethod
 */
export interface ShippingMethod {
  name: string;
  sort: number;
}
