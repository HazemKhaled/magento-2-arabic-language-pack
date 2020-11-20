import { GenericObject } from 'moleculer';

/**
 * Store Type definition
 *
 * @export
 * @interface Store
 */
export interface OmsStore {
  id: string;
  url: string;
  name: string;
  users: GenericObject[];
  companyName: string;
  status: string;
  platform: string;
  stockDate: Date;
  stockStatus: string;
  priceDate: Date;
  priceStatus: string;
  salePrice: number;
  saleOperator: number;
  comparedPrice: number;
  comparedOperator: number;
  currency: string[];
  languages: string[];
  shippingMethods: string[] | { name: string }[];
  credit: number;
  debit: number;
  [key: string]: string | string[] | Date | GenericObject[] | number;
}
