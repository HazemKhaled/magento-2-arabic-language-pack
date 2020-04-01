/**
 * Crm Store Type
 *
 * @export
 * @interface CrmStore
 */
export interface CrmStore {
    id: string;
    Platform?: string;
    Stock_Date?: string;
    Stock_Status?: string;
    Price_Date?: string;
    Price_Status?: string;
    Sale_Price?: number;
    Sale_Operator?: number;
    Compared_Price?: number;
    Compared_Operator?: number;
    Currency?: string;
    Languages?: string;
    Shipping_Methods?: string;
    Billing_Country?: string;
    Billing_City?: string;
    Billing_State?: string;
    Billing_Code?: string;
    Billing_Street?: string;
    Billing_Name?: string;
    Billing_Phone?: string;
    Last_Order_Date: string;
    Subscription_Name: string;
    Subscription_Expiration: string;
}
