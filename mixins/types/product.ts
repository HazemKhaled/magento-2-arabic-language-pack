import { I18nText } from './i18ntext';

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
  variations: Variation[];
}

import { Attribute } from './';
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
}

/**
 * Attribute Type definition
 *
 * @export
 * @interface Attribute
 */
export interface Attribute {
  id: string;
  name: string;
  option: string;
}
