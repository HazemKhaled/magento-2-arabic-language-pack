import { I18nText } from './i18ntext';

/**
 * Product Type definition
 *
 * @export
 * @interface Product
 */
export interface Product {
  sku?: any;
  name?: I18nText;
  updated: Date;
  archive: boolean;
}
