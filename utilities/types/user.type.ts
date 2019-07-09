/**
 * User
 *
 * @export
 * @interface User
 */
export interface User {
  email: string;
  odooPartnerId: number;
  username: string;
  failToSendToOdoo: boolean;
  first_name: string;
  last_name: string;
  business_name: string;
  business_address_1: string;
  business_address_2: string;
  country: string;
  contact_email: string;
  contact_phone_code: string;
  admin_user: boolean;
  is_member: boolean;
  knawatcom_id: number;
  subscriptions: Subscription[];
  browserLanguage: string;
  catalogCurrency: string;
}

/**
 * User subscription
 *
 * @export
 * @interface Subscription
 */
export interface Subscription {
  id: number;
  membership_id: number | string;
  membership_name: string;
  gateway_id: string;
  start_date: Date;
  expire_date: Date;
  trial_expire_date: Date | null;
  trial_period_completed: boolean;
  status: string;
  move_from_id: number | null;
  cancelled_memberships: null;
  source: null;
  source_id: number | null;
  payments: [];
  is_simulated: boolean | null;
  payment_type: string;
  email_log: [];
  name: string;
  title: string;
  description: string;
  post_modified: Date;
  knawat_expire_date: Date;
  knawat_status: string;
  attr_products_limit: number | string;
  attr_stores_limit: number | string;
  attr_language_limit: number | string;
  attr_cod_fees: number | string;
}
