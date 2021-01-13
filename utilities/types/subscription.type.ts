import { GenericObject } from 'moleculer';

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
  retries?: Date[];
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

export interface SubscriptionListParams {
  storeId: string;
  membershipId: string;
  status: string | { $ne: string };
  reference: string;
  expireDate: GenericObject;
  startDate: GenericObject;
  sort: {
    order: number;
    field: string;
  };
  perPage: string;
  page: number;
}

export interface SubscriptionRequestParams {
  storeId?: string;
  expireDate: {
    operation?: string;
    date?: Date;
    $gte?: Date;
    $lte?: Date;
  };
  retries: {
    $ne: Date;
  };
  renewed: {
    $ne: boolean;
  };
  autoRenew: {
    $ne: boolean;
  };
  status: string | { $ne: string };
  afterDays: number;
  beforeDays: number;
}
