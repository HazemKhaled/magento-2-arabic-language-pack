/**
 * User subscription
 *
 * @export
 * @interface Subscription
 */
export interface Subscription {
  _id?: string;
  id?: string;
  membershipId: string;
  storeId: string;
  invoiceId: string;
  startDate: Date;
  expireDate: Date;
  status: 'confirmed' | 'pending' | 'cancelled' | 'active';
  reference?: string;
  donor?: string;
  renewed?: string | boolean;
  autoRenew?: string;
  retries?: number | any[];
  createdAt?: Date;
  updatedAt?: Date;
  coupon?: string;
  sort?: {
    field: string;
    order: number;
  };
  perPage?: number;
  afterDays?: number;
  beforeDays?: number;
  membership?: any;
  grantTo?: string;
  postpaid?: string;
  dueDate?: string;
  date?: {
    start: string;
    expire: string;
  };
  length?: number;
  attributes?: {
    orderProcessingType?: string;
    orderProcessingFees?: number;
  };
  adjustmentDescription?: string;
  adjustment?: number;
}

export interface SubscriptionType extends Subscription {}

export interface SubscriptionListParams extends Subscription {
  page: number;
}
