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
  referenceNumber?: string;
  date: Date;
  description?: string;
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
  reference?: string;
  date: Date;
  description?: string;
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
