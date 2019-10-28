export const CreateSubscriptionValidation = {
    storeId: { type: 'url' },
    membership: { type: 'string' },
    coupon: { type: 'string', optional: true },
    $$strict: true
}

export const UpdateSubscriptionValidation = {
    id: { type: 'string' },
    autoRenew: { type: 'boolean', optional: true },
    renewed: { type: 'boolean', optional: true },
    retries: { type: 'array', items: { type: 'date' }, convert: true, optional: true },
    $$strict: true
}
