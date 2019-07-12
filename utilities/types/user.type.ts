/**
 * User
 *
 * @export
 * @interface User
 */
export interface User {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  country: string;
  contact_email: string;
  subscriptions: Subscription[];
}

/**
 * User subscription
 *
 * @export
 * @interface Subscription
 */
export interface Subscription {
  id: number;
  expire_date: Date;
  status: string;

  name: string;
  title: string;
  description: string;
  attr_products_limit: number | string;
  attr_language_limit: number | string;
  attr_order_processing_fees: number | string;
}
