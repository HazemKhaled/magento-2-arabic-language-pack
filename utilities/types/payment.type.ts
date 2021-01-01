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
  invoices: {
    invoice_id: string;
    amount_applied: number;
  }[];
  bank_charges: number;
  reference: string;
  description: string;
  store: string;
  purchase_units: {
    amount: {
      value: number;
      currency: string;
    };
    description?: string;
  }[];
  customerId?: string;
  page?: number;
  perPage?: number;
  referenceNumber?: string;
  paymentMode?: string;
}
