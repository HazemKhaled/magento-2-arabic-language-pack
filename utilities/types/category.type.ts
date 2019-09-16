import { I18nText } from '../types';

/**
 * Category Type definition
 *
 * @export
 * @interface Category
 */
export interface Category {
  id: number;
  parentId?: number;
  name?: I18nText;
  productsCount: number;
  treeNodeLevel: number;
}
