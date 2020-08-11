/**
 *  Oms tax schema
 *
 * @export
 * @interface OmsTax
 */
export interface OmsTax {
  name: string;
  percentage: number;
  type: 'tax' | 'compound_tax';
}

/**
 * OMS Tax response schema
 *
 * @export
 * @interface OmsTaxResponse
 * @extends {OmsTax}
 */
export interface OmsTaxResponse extends OmsTax {
  id: string;
}
