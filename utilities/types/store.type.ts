import { Context, GenericObject } from 'moleculer';

import { Subscription } from './subscription.type';
import { OrderAddress } from './order.type';

/**
 * Store Type definition
 *
 * @export
 * @interface Store
 */
export interface Store {
  id: string;
  _id: string;
  name: string;
  logo: string;
  currency: string;
  status:
    | 'confirmed'
    | 'unconfirmed'
    | 'archived'
    | 'error'
    | 'uninstalled'
    | 'pending';
  type: string;
  url: string;
  consumer_secret: string;
  consumer_key: string;
  sale_price: number;
  sale_price_operator: number;
  compared_at_price: number;
  compared_at_price_operator: number;
  users: StoreUser[];
  shipping_methods: ShippingMethod[];
  languages: string[];
  credit: number;
  debit: number;
  internal_data: { omsId: string } & GenericObject;
  external_data: GenericObject;
  subscription: Subscription;
  address: StoreAddress;
  companyName: string;
  platform: string;
  stockDate: string;
  stockStatus: string;
  priceDate: string;
  priceStatus: string;
  salePrice: number;
  saleOperator: number;
  comparedPrice: number;
  comparedOperator: number;
  shippingMethods: string[];
  billing: OrderAddress;
  taxNumber: string;
}

export interface StoreAddress extends OrderAddress {
  taxNumber?: string;
}

/**
 * Store User
 *
 * @export
 * @interface StoreUser
 */
export interface StoreUser {
  first_name?: string;
  last_name?: string;
  email: string;
  roles: string[];
}

/**
 * Shipment methods priority
 *
 * @export
 * @interface ShippingMethod
 */
export interface ShippingMethod {
  name: string;
  sort: number;
}

/**
 * Store Request
 *
 * @export
 * @interface StoreRequest
 */
export interface StoreRequest {
  customerId: string;
  storeId: string;
  amount: number;
  id: string;
  consumerKey: string;
  consumerSecret: string;
  withoutBalance: boolean;
  withoutSubscription: boolean;
  filter: string;
  perPage: number;
  page: number;
  query: string;
  url: string;
  token: string;
  limit: number;
  where: any;
  sort: string;
  fields: string;
  sortOrder: string;
}

/**
 * create customer request Definition
 *
 * @export
 * @interface CreateCustomerRequest
 */
export interface CreateCustomerRequest {
  url: string;
  name: string;
  users: any;
  companyName: string;
  status: string;
  platform: string;
  salePrice: number;
  saleOperator: number;
  comparedPrice: number;
  comparedOperator: number;
  currency: string;
  languages: string[];
  shippingMethods: GenericObject;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
}

/**
 * CrmData Definition
 * @export
 * @interface CrmData
 */
export interface CrmData extends Store {
  last_order_date?: string;
  membership_id?: string;
  subscription_expiration?: Date;
}

/**
 * Event Arguments
 *
 * @export
 * @interface EventArguments
 */
export interface EventArguments extends Context {
  storeId: string;
  res: GenericObject;
}
