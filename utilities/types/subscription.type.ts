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
    donor?: string;
  }
