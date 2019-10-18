export const CreateMembershipValidation = {
    name: {
        type: 'object',
        props: {
            tr: { type: 'string', optional: true },
            en: { type: 'string' },
            ar: { type: 'string', optional: true },
            $$strict: true
        }
    },
    tagline: {
        type: 'object',
        props: {
            tr: { type: 'string', optional: true },
            en: { type: 'string' },
            ar: { type: 'string', optional: true },
            $$strict: true
        }
    },
    description: {
        type: 'object',
        props: {
            tr: { type: 'string', optional: true },
            en: { type: 'string' },
            ar: { type: 'string', optional: true },
            $$strict: true
        }
    },
    sort: { type: 'number', integer: true, positive: true },
    active: { type: 'boolean',},
	public: { type: 'boolean',},
    cost: { type: 'number', positive: true },
	discount: { type: 'number', positive: true },
	paymentFrequency: { type: 'number', integer: true, positive: true },
	paymentFrequencyType: { type: 'enum', values: ['month', 'year'] },
    attributes: { type: 'object' },
    isDefault: { type: 'boolean', optional: true },
    $$strict: true
}
