/**
 * User subscription
 *
 * @export
 * @interface Subscription
 */
export interface Subscription {
    _id?: number;
    id: number;
    membershipId: number;
    membershipName: string;
    gatewayId: string;
    startDate: string;
    expireDate: string;
    trialExpireDate: string;
    trialPeriodCompleted: boolean;
    status: string;
    payments: any[];
    paymentType: string,
    name?: string;
    title?: string;
    description?: string;
  }
