import { I18nText } from './i18ntext.type';

/**
 * Category Type definition
 *
 * @export
 * @interface Category
 */
export interface Category {
  id: string | number;
  parentId: number;
  name: I18nText;
  name_i18n?: I18nText;
  productsCount: number;
  treeNodeLevel: number;
}
