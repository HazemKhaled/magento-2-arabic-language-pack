export const CreateCouponValidation = {
    "code": { type: "string" },
	"discount": { type: "number", positive: true },
	"discountType": { type: "enum", values: ['$', '%'] },
	"startDate": { type: "date", convert: true },
	"endDate": { type: "date", convert: true },
	"maxUses": { type: "number", integer: true, positive: true },
	"appliedMemberships": { type: "array", items: { type: 'string' } },
}

export const UpdateCouponValidation = {
    "id": { type: "string" },
	"discount": { type: "number", positive: true, optional: true },
	"discountType": { type: "enum", values: ['$', '%'], optional: true },
	"startDate": { type: "date", convert: true, optional: true },
	"endDate": { type: "date", convert: true, optional: true },
	"maxUses": { type: "number", integer: true, positive: true, optional: true },
	"appliedMemberships": { type: "array", items: { type: 'string' }, optional: true },
}
