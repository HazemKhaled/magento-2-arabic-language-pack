/**
 * Store Type definition
 *
 * @export
 * @interface Store
 */
export interface OmsStore {
  id?: string;
  url?: string;
  name?: string;
  users?: Array<{}>;
  companyName?: string;
  status?: string;
  platform?: string;
  stockDate?: Date;
  stockStatus?: string;
  priceDate?: Date;
  priceStatus?: string;
  salePrice?: number;
  saleOperator?: number;
  comparedPrice?: number;
  comparedOperator?: number;
  currency?: string[];
  languages?: string[];
  shippingMethods?: string[] | Array<{ name: string }>;
  credit?: number;
  debit?: number;
  [key: string]: string | string[] | Date | Array<{}> | number;
}
