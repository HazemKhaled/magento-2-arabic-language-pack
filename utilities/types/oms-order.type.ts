import { OmsAddress } from './oms-address.type';
import { OmsInvoice } from './oms-invoice.type';
import { OmsOrderItem } from './oms-order-item.type';
import { OmsStore } from './oms-store.type';

export interface OmsOrder {
  id: string;
  store: OmsStore;
  externalId?: string;
  status:
    | string
    | 'draft'
    | 'open'
    | 'invoiced'
    | 'partially_invoiced'
    | 'void'
    | 'overdue';
  subStatuses: string[];
  createDate: Date;
  updateDate: Date;
  items?: OmsOrderItem[];
  shipping: OmsAddress;
  invoice_url?: string;
  trackingNumber?: string;
  shipping_method?: string;
  shipmentDate?: string;
  shipping_charge: number;
  discount?: string | number;
  adjustment: number;
  adjustmentDescription: string;
  subscription: string;
  total: number;
  hasQtyCancelled: boolean;
  coupon?: string;
  storeLogo?: string;
  notes?: string;
  orderNumber: string;
  invoices?: OmsInvoice[];
  isInclusiveTax?: boolean;
  taxTotal?: number;
  warnings?: string[];
  financialStatus: string;
  fulfillmentStatus: string;
  warningsSnippet?: string;
  knawat_order_status: string;
  taxes?: { taxName: string; taxAmount: number }[];
}

export interface OmsOrderResponse {
  salesorders: OmsOrder[];
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