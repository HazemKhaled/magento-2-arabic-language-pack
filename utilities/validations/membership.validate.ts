export const CreateMembershipValidation = {
    name: {
        type: 'object',
        props: {
            tr: { type: 'string', optional: true },
            en: { type: 'string' },
            ar: { type: 'string', optional: true },
        }
    },
    tagline: { type: 'string',},
    description: {
        type: 'object',
        props: {
            tr: { type: 'string', optional: true },
            en: { type: 'string' },
            ar: { type: 'string', optional: true },
        }
    },
    sort: { type: 'number', integer: true, positive: true },
    active: { type: 'boolean',},
	public: { type: 'boolean',},
    cost: { type: 'number', positive: true },
	discount: { type: 'number', positive: true },
	paymentFrequency: { type: 'number', integer: true, positive: true },
	paymentFrequencyType: { type: 'enum', values: ['month', 'year'] },
	attributes: { type: 'object',},
}
