/**
 * User subscription
 *
 * @export
 * @interface Subscription
 */
export interface Subscription {
  _id?: number;
  id?: number | string;
  membershipId: number;
  storeId: string;
  invoiceId: string;
  startDate: Date;
  expireDate: Date;
  status: 'confirmed' | 'pending' | 'cancelled' | 'active';
  reference?: string;
  donor?: string;
  renewed?: string;
  autoRenew?: string;
  retries?: number;
  createdAt: Date;
  updatedAt: Date;
  coupon?: string;
  sort?: {
    field: string;
    order: string;
  };
  perPage?: string;
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
}

export interface SubscriptionType extends Subscription {}
