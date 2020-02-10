import { I18nText } from './i18ntext.type';

/**
 * Product Type definition
 *
 * @export
 * @interface Product
 */
export interface Product {
  sku?: string;
  name?: I18nText;
  updated: Date;
  archive: boolean;
  variations?: Variation[];
  sales_qty?: number;
  seller_id?: number;
  source_url?: string;
  images?: string[];
  barcode?: string;
  tax_class?: string;
}

/**
 * Variation Type definition
 *
 * @export
 * @interface Variation
 */
export interface Variation {
  sku: string;
  externalId?: string;
  cost_price: number;
  sale?: number;
  sale_price: number;
  market_price: number;
  weight: number;
  quantity: number;
  attributes: Attribute[];
  logs?: object[];
  cost?: number;
}

/**
 * Attribute Type definition
 *
 * @export
 * @interface Attribute
 */
export interface Attribute {
  id: string;
  name: { [key: string]: string };
  option: { [key: string]: string };
}
