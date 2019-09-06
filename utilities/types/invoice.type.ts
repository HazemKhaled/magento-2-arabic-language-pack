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
}

/**
 * Invoice type
 *
 * @export
 * @interface Invoice
 */
export interface Invoice {
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
}
