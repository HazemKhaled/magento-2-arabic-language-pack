/**
 * Coupon type
 *
 * @export
 * @interface Coupon
 */
export interface Coupon {
  _id?: string;
  id?: string;
  code?: string;
  type: string;
  discount: {
    total?: Discount;
    shipping?: Discount;
    tax?: Discount;
  };
  startDate: Date;
  endDate: Date;
  maxUses: number;
  appliedMemberships: string[];
  useCount: number;
  auto: boolean;
  createdAt: Date;
  updatedAt: Date;
  campaignName?: string;
  minAppliedAmount: number;
}

interface Discount {
  value: number;
  type: '$' | '%';
}
