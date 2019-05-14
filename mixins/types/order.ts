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
  line_items?: OrderLine[];
  items: OrderLine[];
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
 * OrderLine Type definition
 *
 * @export
 * @interface OrderLine
 */
export interface OrderLine {
  sku: string;
}
