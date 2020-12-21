export interface OmsOrderItem {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  url: string;
  image: string;
  weight: number;
  rate: number;
  quantity: number;
  quantityCancelled: number;
  productType?: 'goods' | 'services';
  discount?: string;
  discountAmount?: number;
  total?: number;
  purchaseRate?: number;
  vendorId?: string;
  accountId?: string;
  taxId?: string;
  taxName?: string;
  taxType?: string;
  taxPercentage?: number;
}
