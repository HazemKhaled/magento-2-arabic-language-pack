import { ServiceSchema } from 'moleculer';

export const MembershipValidation: ServiceSchema = {
  name: 'membership',
  actions: {
    createOne: {
      params: {
        id: {
          type: 'string',
          optional: true,
        },
        name: {
          type: 'object',
          strict: true,
          props: {
            tr: {
              type: 'string',
              optional: true,
            },
            en: {
              type: 'string',
            },
            ar: {
              type: 'string',
              optional: true,
            },
          },
        },
        tagline: {
          type: 'object',
          strict: true,
          props: {
            tr: {
              type: 'string',
              optional: true,
            },
            en: {
              type: 'string',
            },
            ar: {
              type: 'string',
              optional: true,
            },
          },
        },
        description: {
          type: 'object',
          strict: true,
          props: {
            tr: {
              type: 'string',
              optional: true,
            },
            en: {
              type: 'string',
            },
            ar: {
              type: 'string',
              optional: true,
            },
          },
        },
        sort: {
          type: 'number',
          integer: true,
          positive: true,
        },
        active: {
          type: 'boolean',
        },
        public: {
          type: 'boolean',
        },
        cost: [
          { type: 'number', positive: true },
          { type: 'enum', values: [0] },
        ],
        discount: [
          { type: 'number', positive: true },
          { type: 'enum', values: [0] },
        ],
        paymentFrequency: {
          type: 'number',
          integer: true,
          positive: true,
        },
        paymentFrequencyType: {
          type: 'enum',
          values: ['month', 'year'],
        },
        attributes: {
          type: 'object',
        },
        isDefault: {
          type: 'boolean',
          optional: true,
        },
        country: {
          type: 'string',
          pattern: '^[A-Z]{2}$',
          optional: true,
        },
        $$strict: true,
      },
    },
    updateOne: {
      params: {
        id: {
          type: 'string',
        },
        name: {
          type: 'object',
          strict: true,
          props: {
            tr: {
              type: 'string',
              optional: true,
            },
            en: {
              type: 'string',
              optional: true,
            },
            ar: {
              type: 'string',
              optional: true,
            },
          },
          optional: true,
        },
        tagline: {
          type: 'object',
          strict: true,
          optional: true,
          props: {
            tr: {
              type: 'string',
              optional: true,
            },
            en: {
              type: 'string',
              optional: true,
            },
            ar: {
              type: 'string',
              optional: true,
            },
          },
        },
        description: {
          type: 'object',
          strict: true,
          optional: true,
          props: {
            tr: {
              type: 'string',
              optional: true,
            },
            en: {
              type: 'string',
              optional: true,
            },
            ar: {
              type: 'string',
              optional: true,
            },
          },
        },
        sort: {
          type: 'number',
          integer: true,
          positive: true,
          optional: true,
        },
        active: {
          type: 'boolean',
          optional: true,
        },
        public: {
          type: 'boolean',
          optional: true,
        },
        cost: [
          { type: 'number', positive: true, optional: true },
          { type: 'enum', values: [0], optional: true },
        ],
        discount: [
          { type: 'number', positive: true, optional: true },
          { type: 'enum', values: [0], optional: true },
        ],
        paymentFrequency: {
          type: 'number',
          integer: true,
          positive: true,
          optional: true,
        },
        paymentFrequencyType: {
          type: 'enum',
          values: ['month', 'year'],
          optional: true,
        },
        attributes: {
          type: 'object',
          optional: true,
        },
        isDefault: {
          type: 'boolean',
          optional: true,
        },
        country: {
          type: 'string',
          pattern: '^[A-Z]{2}$',
          optional: true,
        },
        $$strict: true,
      },
    },
    getOne: {
      params: {
        id: [
          {
            type: 'string',
          },
          {
            type: 'number',
          },
        ],
        country: {
          type: 'string',
          pattern: '^[A-Z]{2}$',
          optional: true,
        },
        coupon: {
          type: 'string',
          optional: true,
        },
        active: {
          type: 'boolean',
          optional: true,
        },
      },
    },
    getAll: {
      params: {
        country: {
          type: 'string',
          pattern: '^[A-Z]{2}$',
          optional: true,
        },
      },
    },
  },
};
