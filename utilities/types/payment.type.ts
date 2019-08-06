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
  date: Date;
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
  date: Date;
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
