import { I18nText } from './i18ntext';
import { Variation } from './variation';

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
  variations: Variation[];
}
