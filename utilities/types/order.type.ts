/**
 * Order Type definition
 *
 * @export
 * @interface Order
 */
export interface Order {
  id: string;
  status: string;
  state?: string;
  knawat_order_status: string;
  line_items?: OrderItem[];
  items: OrderItem[];
  billing: object;
  shipping: object;
  total: number;
  date_created?: Date;
  createDate: Date;
  knawat_status?: Date;
  meta_data?: {
    length: number;
    forEach: (arg0: (meta: any) => void) => void;
  };

  [key: string]: any;
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
  purchase_rate: number;
  vendor_id: number;
  description?: string;
  productType?: string;
  discount?: string;
  discountAmount?: number;
  total?: number;
  weight?: number;
}

/**
 * Definition for oms create order response
 *
 * @export
 * @interface OMSResponse
 */
export interface OMSResponse {
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
    total: number;
    hasQtyCancelled: boolean;
    notes?: string;
  };
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
