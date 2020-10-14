/**
 * User subscription
 *
 * @export
 * @interface Subscription
 */
export interface Subscription {
  _id?: number;
  id?: number | string;
  membershipId?: number;
  storeId?: string | number;
  invoiceId?: string;
  startDate?: Date;
  expireDate?: any;
  status?: 'confirmed' | 'pending' | 'cancelled' | 'active';
  reference?: string;
  donor?: string | number;
  renewed?: string | boolean;
  autoRenew?: string;
  retries?: number | any[];
  createdAt?: Date;
  updatedAt?: Date;
  coupon?: string;
  sort?: {
    field: string;
    order: string | number;
  };
  perPage?: string | number;
  page?: string;
  afterDays?: number;
  beforeDays?: number;
  membership?: string;
  grantTo?: string;
  postpaid?: string;
  dueDate?: string;
  date?: {
    start: string;
    expire: string;
  };
  length?: number;
}

export interface SubscriptionType extends Subscription {}
