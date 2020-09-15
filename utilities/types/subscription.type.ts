/**
 * User subscription
 *
 * @export
 * @interface Subscription
 */
export interface Subscription {
  _id?: number;
  id?: number;
  membershipId: number;
  storeId: string;
  invoiceId: string;
  startDate: Date;
  expireDate: Date;
  status: 'confirmed' | 'pending' | 'cancelled';
  reference?: string;
  donor?: string;
  renewed?: string;
  autoRenew?: string;
  retries?: number;
  createdAt: Date;
  updatedAt: Date;
  coupon?: string;
}
