/**
 * Coupon type
 *
 * @export
 * @interface Coupon
 */
export interface Coupon {
    code: string;
	discount: number;
	discountType: '$' | '%';
	startDate: Date;
	endDate: Date;
	maxUses: number;
    appliedMemberships: string[];
    useCount: number;
}
