import { GenericObject } from 'moleculer';

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
  description: I18nText;
  attributes: Attribute;
  variations: Variation[];
  sales_qty?: number;
  seller_id?: number;
  source_url?: string;
  images: string[];
  barcode?: string;
  tax_class?: string;
  categories: string[];
  externalId?: string;
  externalUrl?: string;
  imported: string[];
  createdAt?: Date;
  import_qty: number;
  quantity?: number;
  ship_to: string[];
  index?: string;
  body?: GenericObject;
  type?: string;
  id?: string;
  handling_time?: {
    to?: number;
  };
  ship_from?: ShipFrom[];
  supplier?: string;
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
  archive?: boolean;
  attributes: Attribute[];
  logs?: GenericObject[];
  cost?: number;
}

/**
 * Attribute Type definition
 *
 * @export
 * @interface Attribute
 */
export interface Attribute {
  name: { [key: string]: string };
  option: { [key: string]: string };
}

/**
 * Ship From definition
 *
 * @export
 * @interface ShipFrom
 */
export interface ShipFrom {
  city: string;
  country: string;
}

/** multiple Products definition
 *
 * @export
 * @interface Products
 */
export interface Products {
  products: [
    {
      id?: string;
      sku?: string;
      qty?: number;
      attribute?: string;
      imported?: string;
    }
  ];
  sku?: string;
  skus?: string[];
  productInstances?: [
    {
      sku: string;
      externalUrl: string;
      externalId: string;
      error: any[];
      variations: any[];
    }
  ];
}

/**
 * UpdateProductParams definition
 * @export
 * @interface UpdateProductParams
 */
export interface UpdateProductParams extends Product {
  error: string;
  products: {
    id: string;
    qty: number;
    attribute: string;
  };
}
/**
 * Product search Params
 *
 * @export
 * @interface ProductSearchParams
 */
export interface ProductSearchParams {
  storeKey: string;
}
export interface ProductListParams {
  page: number;
  limit: number;
  lastupdate: number;
  hideOutOfStock: number;
  keyword: string;
  externalId: string;
  hasExternalId: number;
  currency: string;
  sort: 'd' | 'a';
}

export interface ProductTotalParams {
  lastUpdate?: string;
  hideOutOfStock?: number;
  hasExternalId?: number;
}
