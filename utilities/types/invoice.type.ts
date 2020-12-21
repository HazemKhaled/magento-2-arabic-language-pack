/**
 * Invoice type
 *
 * @export
 * @interface Invoice
 */
export interface InvoiceResponse {
  invoice_id: string;
  customer_name: string;
  customer_id: string;
  status: string;
  invoice_number: string;
  reference_number: string;
  date: Date;
  due_date: Date;
  due_days: string;
  total: number;
  balance: number;
  created_time: Date;
  last_modified_time: Date;
  shipping_charge: number;
  adjustment: number;
  invoices: [{ invoice_id: string }];
  invoice: { invoiceId: string };
  invoicePayments: [
    {
      invoicePaymentId: string;
      paymentId: string;
      invoiceId: string;
      amountUsed: 0;
    }
  ];
  creditNotes: [
    {
      creditNotesInvoiceId: string;
      creditNoteId: string;
      invoiceId: string;
      amountApplied: 0;
      date: string;
    }
  ];
  code: number;
  message: string;
}

/**
 * Invoice type
 *
 * @export
 * @interface Invoice
 */
export interface Invoice {
  id: string;
  invoiceId: string;
  customerName: string;
  customerId: string;
  status: string;
  invoiceNumber: string;
  referenceNumber: string;
  date: Date;
  dueDate: Date;
  dueDays: string;
  total: number;
  balance: number;
  createdTime: Date;
  lastModifiedTime: Date;
  shippingCharge: number;
  adjustment: number;
  message: string;
  code: number;
  invoice: {
    invoiceId: string;
  };
  omsId: string;
  invoice_id: string;
  customer_name: string;
  customer_id: string;
  invoice_number: string;
  reference_number: string;
  due_date: string;
  due_days: string;
  created_time: string;
  last_modified_time: string;
  shipping_charge: number;
  coupon: string;
}

/**
 * Invoice Request Params
 *
 * @export
 * @interface InvoiceRequestParams
 */
export interface InvoiceRequestParams {
  id: string;
  storeId: string;
  customerId: string;
  orderId: string;
  items: any;
  discount: {
    value: number;
    type: string;
  };
  isInclusiveTax: boolean;
  coupon: string;
  dueDate: string;
  useSavedPaymentMethods: string;
  credit: number;
  paymentAmount: number;
  omsId: string;
  invoiceId: string;
  status: string;
  reference_number: string;
}
