/**
 * Coupon type
 *
 * @export
 * @interface Coupon
 */
export interface Coupon {
    code: string;
	discount: string;
	discountType: string;
	startDate: Date;
	endDate: Date;
	maxUses: number;
    appliedMemberships: string[];
    useCount: number;
}
