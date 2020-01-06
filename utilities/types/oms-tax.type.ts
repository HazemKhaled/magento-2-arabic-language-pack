/**
 *  Oms tax schema
 *
 * @export
 * @interface OmsTax
 */
export interface OmsTax {
    name: string;
    percentage: number;
    type: string;
    authorityName: string;
    authorityId: string;
    country: string;
    isEditable: true;
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
