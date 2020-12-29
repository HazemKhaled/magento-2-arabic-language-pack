/**
 * Tax type definition
 *
 * @export
 * @interface Tax
 */
export interface DbTax {
  _id: string;
  id: string;
  name: string;
  amount: number;
  percentage: number;
  isEditable: boolean;
  type: string;
  class: string[];
  country: string;
  omsId: string;
  isInclusive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * TaxRequestParams type definition
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

/**
 * OMS Tax Response type definition
 *
 * @export
 * @interface OmsTaxResponse
 */
export interface OmsTaxResponse {
  tax: DbTax;
  code: number;
  message: string;
}
