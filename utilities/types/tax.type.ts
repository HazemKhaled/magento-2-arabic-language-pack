/**
 * Tax type definition
 *
 * @export
 * @interface Tax
 */
export interface DbTax {
  class: string[];
  country: string;
  percentage: number;
  name: string;
  omsId: string;
  isInclusive: boolean;
  _id: string;
  id: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * TaxRequestParams type definition
 * Schema related to endpoint response
 *
 * @export
 * @interface TaxRequestParams
 */
export interface TaxRequestParams {
  id: string;
  name: string;
  percentage: number;
  type: string;
  class: string[];
  country: string;
  page: string;
  perPage: string;
  query: string;
}
