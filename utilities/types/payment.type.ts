import { GenericObject } from 'moleculer';

/**
 * Payment
 *
 * @export
 * @interface Payment
 */
export interface Payment {
  storeId: string;
  paymentMode: string;
  amount: number;
  invoices: PaymentInvoice[];
  bankCharges: number;
  accountId: string;
  accountName: string;
  paymentId: string;
  unusedAmount: number;
  referenceNumber: string;
  date: Date;
  description: string;
  customerId: string;
  force: boolean;
}

/**
 * PaymentResponse
 *
 * @export
 * @interface PaymentResponse
 */
export interface PaymentResponse {
  store_id: string;
  payment_mode: string;
  amount: number;
  invoices: PaymentInvoiceResponse[];
  bank_charges: number;
  account_id: string;
  account_name: string;
  payment_id: string;
  unused_amount: number;
  reference: string;
  date: Date;
  description: string;
  payments: [Payment];
}

/**
 * OMS PaymentResponse
 *
 * @export
 * @interface OmsPaymentResponse
 */
export interface OmsPaymentResponse {
  payments: Payment[];
  code: number;
  message: string;
  page_context: {
    has_more_page: boolean;
    page: number;
    per_page: number;
    search_criteria: [
      {
        column_name: string;
        comparator: string;
        search_text: string;
        search_text_formatted: string;
      }
    ];
    sort_column: string;
    sort_order: string;
  };
}

/**
 * PaymentInvoice
 *
 * @interface PaymentInvoice
 */
export interface PaymentInvoice {
  amountApplied: number;
  invoiceId: string;
}

/**
 * PaymentInvoiceResponse
 *
 * @interface PaymentInvoiceResponse
 */
export interface PaymentInvoiceResponse {
  amount_applied: number;
  invoice_id: string;
}

/**
 * PaymentRequestParams
 *
 * @interface PaymentRequestParams
 */
export interface PaymentRequestParams {
  id: string;
  payment_mode: string;
  amount: number;
  account_id: string;
  invoices: GenericObject;
  bank_charges: number;
  reference: string;
  description: string;
}
