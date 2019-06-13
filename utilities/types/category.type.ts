import { I18nText } from '../types';

/**
 * Category Type definition
 *
 * @export
 * @interface Category
 */
export interface Category {
  // after transform
  id: string;
  name: string;

  // before transform
  odooId?: string;
  name_i18n?: I18nText;
}
