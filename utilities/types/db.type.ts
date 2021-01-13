import { GenericObject } from 'moleculer';
/**
 * Generic queries for moleculer-db npm actions
 *
 * @export
 * @interface ListParams
 */
export interface ListParams {
  populate: string[];
  fields: string[];
  page: number;
  pageSize: number;
  sort: string;
  search: string;
  searchFields: string;
  query: GenericObject;
}
