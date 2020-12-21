/**
 *  Oms tax schema
 *
 * @export
 * @interface OmsTax
 */
export interface OmsTax {
  id?: string;
  name?: string;
  amount?: number;
  percentage?: number;
  type?: 'tax' | 'compound_tax';
  isEditable?: boolean;
}

export interface OmsRequestParams {
  omsId: string;
  page: number;
  limit: number;
  reference_number: string;
  invoice_number: string;
  customerId: string;
  discount: number;
  discountType: string;
  coupon: string;
  items: [
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
  isInclusiveTax: boolean;
  invoiceId: string;
  status: string;
}
