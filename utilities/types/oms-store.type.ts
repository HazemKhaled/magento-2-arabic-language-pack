/**
 * Store Type definition
 *
 * @export
 * @interface OmsStore
 */
export interface OmsStore {
  id: string;
  url: string;
  name?: string;
  users?: OmsStoreUser[];
  companyName?: string;
  status?: string;
  platform?: string;
  salePrice?: number;
  saleOperator?: number;
  comparedPrice?: number;
  comparedOperator?: number;
  currency?: string;
  languages?: string[];
  shippingMethods?: string[];
  billing?: OmsStoreAddress;
  credit: number;
  debit: number;
  taxNumber: string;
}

export interface OmsStoreAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country: string;
  email?: string;
  phone?: string;
}

export interface OmsStoreUser {
  email: string;
  first_name: string;
  last_name: string;
  mobile?: string;
  roles: string[];
  primary?: boolean;
}
