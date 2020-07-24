/**
 * Order Type definition
 *
 * @export
 * @interface Order
 */
export interface Order {
  id?: string;
  status: string;
  knawat_order_status?: string;
  line_items?: OrderItem[];
  items?: OrderItem[];
  billing?: object;
  shipping: OrderAddress;
  total?: number;
  createDate?: Date;
  externalId?: string;
  updateDate?: Date;
  notes?: string;
  externalInvoice?: string;
  invoice_url?: string;
  shipmentCourier?: string;
  shipmentTrackingNumber?: string;
  shipmentDate?: Date,
  shipping_method?: string;
  discount?: number;
  store?: {};
  orderNumber?: string;
  taxTotal?: number;
  shipping_charge?: number;
  adjustment?: number;
  storeLogo?: string;
  warnings?: string;
  warningsSnippet?: string;
}

/**
 *  Error Response
 * @export
 * @interface ResError
 */
export interface ResError {
  errors: Array<{ message: string }>;
}

/**
 * OrderItem Type definition
 *
 * @export
 * @interface OrderItem
 */
export interface OrderItem {
  id?: string;
  sku: string;
  name: string;
  url: string;
  rate: number;
  quantity: number;
  purchaseRate: number;
  vendorId: number;
  description?: string;
  productType?: string;
  discount?: string;
  discountAmount?: number;
  total?: number;
  weight?: number;
  archive?: boolean;
  quantityRequired?: number;
  taxId?: string;
  taxClass?: string;
  warnings?: string;
}

/**
 * Definition for oms create order response
 *
 * @export
 * @interface OMSResponse
 */
export interface OrderOMSResponse {
  salesorder: {
    id?: string;
    store?: {
      id: string;
      url: string;
    };
    status: string;
    subStatuses?: [];
    createDate: Date;
    updateDate?: Date;
    items: OrderItem[];
    shipping: OrderAddress;
    billing: OrderAddress;
    shipmentCourier?: string;
    shippingCharge: number;
    discount?: number;
    total: number;
    hasQtyCancelled: boolean;
    notes?: string;
    adjustment: number;
    adjustmentDescription: string;
    orderNumber: string;
    taxTotal: number;
  };
  error?: { [key: string]: any };
}

/**
 * Order address schema
 *
 * @export
 * @interface OrderAddress
 */
export interface OrderAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country: string;
  phone?: string;
  email?: string;
}
