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
    postModified: string;
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
