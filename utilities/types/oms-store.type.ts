import { OmsAddress } from './oms-address.type';

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
  billing?: OmsAddress;
  credit: number;
  debit: number;
  taxNumber: string;
}

export interface OmsStoreUser {
  email: string;
  first_name: string;
  last_name: string;
  mobile?: string;
  roles: string[];
  primary?: boolean;
}
