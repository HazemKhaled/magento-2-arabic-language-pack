/**
 * Tax type definition
 *
 * @export
 * @interface Tax
 */
export interface Tax {
  class: string[];
  country: string;
  percentage: number;
  name: string;
  omsId: string;
  isInclusive: boolean;
}

/**
 * DbTax type definition
 * Schema related to database
 *
 * @export
 * @interface DbTax
 */
export interface DbTax extends Tax {
  _id: string;
  id?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * RTax type definition
 * Schema related to endpoint response
 *
 * @export
 * @interface RTax
 */
export interface RTax {
  id: string;
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
  name?: string;
  percentage?: number;
  type?: string;
  class?: string[];
  country?: string;
  page?: string;
  perPage?: string;
  query?: string;
}
