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
  line_items?: object[];
  items: object[];
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
