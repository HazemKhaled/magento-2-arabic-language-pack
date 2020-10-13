import { GenericObject } from 'moleculer';

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
  billing?: GenericObject;
  shipping: OrderAddress;
  total?: number;
  createDate?: Date;
  externalId?: string;
  updateDate?: Date;
  notes?: string;
  invoice_url?: string;
  shipping_charge?: number;
  shipmentTrackingNumber?: string;
  shipmentDate?: Date;
  shipping_method?: string;
  discount?: number;
  store?: GenericObject;
  orderNumber?: string;
  taxTotal?: number;
  adjustment?: number;
  storeLogo?: string;
  warnings?: OrderWarnings | string;
  warningsSnippet?: string;
  financialStatus?:
    | 'unpaid'
    | 'paid'
    | 'partially_paid'
    | 'voided'
    | 'wallet_refunded'
    | 'wallet_partially_refunded'
    | 'refunded'
    | 'partially_refunded';
  fulfillmentStatus?:
    | 'pending'
    | 'processing'
    | 'packed'
    | 'shipped'
    | 'delivered'
    | 'voided';
}

/**
 *  Error Response
 * @export
 * @interface ResError
 */
export interface ResError {
  errors: { message: string }[];
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
  warnings?: string[];
  ship_to?: string[];
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
    shipping_charge?: number;
    shipping_method: string;
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

export type OrderWarnings = { message: string; sku: string }[];

/**
 * Create Order schema
 *
 * @exports
 * @interface CreateOrderRequestParams
 */
export interface CreateOrderRequestParams {
  store: {
    id: string;
    name: string;
    url: string;
    users: [
      {
        items: {
          email: string;
          first_name: string;
          last_name: string;
        };
      }
    ];
  };
  externalId: string;
  status: string;
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
        productType: string;
        purchaseRate: number;
        vendorId: string;
        accountId: string;
      };
    }
  ];
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  invoice_url: string;
  shipping_method: string;
  shipping_charge: number;
  discount: string;
  adjustment: number;
  adjustmentDescription: string;
  subscription: string;
  notes: string;
  orderNumber: string;
  warnings: string;
  warningsSnippet: string;
}
/**
 * update Order schema
 *
 * @exports
 * @interface updateOderRequestParams
 */
export interface updateOderRequestParams {
  customerId: string;
  orderId: string;
  externalId: string;
  status: string;
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
        productType: string;
        purchaseRate: number;
        vendorId: string;
        accountId: string;
      };
    }
  ];
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  invoice_url: string;
  shipping_method: string;
  shipping_charge: number;
  discount: string;
  adjustment: number;
  adjustmentDescription: string;
  subscription: string;
  notes: string;
  orderNumber: string;
  warnings: string;
  warningsSnippet: string;
}

/**
 * Order schema
 *
 * @exports
 * @interface OrderRequestParams
 */
export interface OrderRequestParams extends Order {
  customerId?: string;
  orderId?: string;
  coupon?: string;
  order_id?: string;
  limit?: number;
}

/**
 * Order MetaParams Definition
 *
 * @exports
 * @interface OrderMetaParams
 */
export interface OrderMetaParams {
  store: GenericObject;
}
