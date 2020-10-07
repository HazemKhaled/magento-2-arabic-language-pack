import { StringNullableChain } from 'lodash';

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

export interface OmsRequestParams {
  omsId?: string;
  page?: number;
  limit?: number;
  reference_number?: string;
  invoice_number?: string;
  customerId?: string;
  discount?: number;
  discountType?: string;
  coupon?: string;
  items?: [
    {
      items: {
        sku: string;
        barcode: string;
        name: string;
        description: string;
        url: string;
        image: string;
        weight: number;
        rate: number;
        quantity: number;
        accountId: string;
        purchaseRate: number;
        vendorId: number;
        taxId: string;
      };
    }
  ];
  isInclusiveTax?: boolean;
  invoiceId?: string;
  status?: string;
}
