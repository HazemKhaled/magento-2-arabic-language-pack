import { OmsOrderItem } from './oms-order-item.type';

export interface OmsInvoice {
  invoiceId: string;
  customerName: string;
  customerId: string;
  status: string;
  coupon: string;
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
  items: OmsOrderItem[];
  isInclusiveTax?: boolean;
}
