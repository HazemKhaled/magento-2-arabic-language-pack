/**
 * User subscription
 *
 * @export
 * @interface Subscription
 */
export interface Subscription {
    id: number;
    membership_id: number;
    membership_name: string;
    gateway_id: string;
    start_date: string;
    expire_date: string;
    trial_expire_date: string;
    trial_period_completed: boolean;
    status: string;
    payments: any[];
    payment_type: string,
    post_modified: string;
    name?: string;
    title?: string;
    description?: string;
    attr_products_limit: number;
    attr_stores_limit: number;
    attr_language_limit: number;
    attr_order_processing_fees: number | string;
    attr_cod_fees: number;
    attr_users_limit: number;
  }
