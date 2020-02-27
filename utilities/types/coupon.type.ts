/**
 * Coupon type
 *
 * @export
 * @interface Coupon
 */
export interface Coupon {
    _id?: string;
    code: string;
	discount: {
        total?: Discount,
        shipping?: Discount,
        tax?: Discount
    };
	startDate: Date;
	endDate: Date;
	maxUses: number;
    appliedMemberships: string[];
    useCount: number;
    auto: boolean;
}

interface Discount {
    value: number,
    type: '$' | '%'
}
