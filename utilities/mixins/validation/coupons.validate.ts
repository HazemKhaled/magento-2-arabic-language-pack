import { ServiceSchema } from 'moleculer';

export const CouponsValidation: ServiceSchema = {
  name: 'coupons',
  actions: {
    createOne: {
      params: {
        code: {
          type: 'string',
          pattern: '^[A-Z0-9]+$',
        },
        type: {
          type: 'enum',
          values: ['salesorder', 'subscription'],
        },
        discount: {
          type: 'object',
          strict: true,
          props: {
            tax: {
              type: 'object',
              strict: true,
              optional: true,
              props: {
                value: { type: 'number', integer: true },
                type: { type: 'enum', values: ['%', '$'] },
              },
            },
            shipping: {
              type: 'object',
              strict: true,
              optional: true,
              props: {
                value: { type: 'number', integer: true },
                type: { type: 'enum', values: ['%', '$'] },
              },
            },
            total: {
              type: 'object',
              strict: true,
              optional: true,
              props: {
                value: { type: 'number', integer: true },
                type: { type: 'enum', values: ['%', '$'] },
              },
            },
          },
        },
        startDate: {
          type: 'date',
          convert: true,
        },
        endDate: {
          type: 'date',
          convert: true,
        },
        maxUses: {
          type: 'number',
          integer: true,
          positive: true,
        },
        minAppliedAmount: {
          type: 'number',
          optional: true,
        },
        appliedMemberships: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        auto: {
          type: 'boolean',
        },
        campaignName: {
          type: 'string',
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
        membership: {
          type: 'string',
          optional: true,
        },
        type: {
          type: 'enum',
          values: ['salesorder', 'subscription'],
          optional: true,
        },
      },
    },
    getAll: {
      params: {
        id: [
          {
            type: 'string',
            optional: true,
          },
          {
            type: 'number',
            optional: true,
          },
        ],
        membership: {
          type: 'string',
          optional: true,
        },
        type: {
          type: 'enum',
          values: ['salesorder', 'subscription'],
          optional: true,
        },
        totalAmount: {
          type: 'number',
          convert: true,
          optional: true,
        },
        isValid: [
          {
            type: 'boolean',
            optional: true,
          },
          {
            type: 'enum',
            values: ['0', '1'],
            optional: true,
          },
        ],
        isAuto: [
          {
            type: 'boolean',
            optional: true,
          },
          {
            type: 'enum',
            values: ['0', '1'],
            optional: true,
          },
        ],
      },
    },
    updateOne: {
      params: {
        id: {
          type: 'string',
        },
        type: {
          type: 'enum',
          values: ['salesorder', 'subscription'],
          optional: true,
        },
        discount: {
          type: 'object',
          strict: true,
          optional: true,
          props: {
            tax: {
              type: 'object',
              strict: true,
              optional: true,
              props: {
                value: { type: 'number', integer: true },
                type: { type: 'enum', values: ['%', '$'] },
              },
            },
            shipping: {
              type: 'object',
              strict: true,
              optional: true,
              props: {
                value: { type: 'number', integer: true },
                type: { type: 'enum', values: ['%', '$'] },
              },
            },
            total: {
              type: 'object',
              strict: true,
              optional: true,
              props: {
                value: { type: 'number', integer: true },
                type: { type: 'enum', values: ['%', '$'] },
              },
            },
          },
        },
        startDate: {
          type: 'date',
          convert: true,
          optional: true,
        },
        endDate: {
          type: 'date',
          convert: true,
          optional: true,
        },
        maxUses: {
          type: 'number',
          integer: true,
          positive: true,
          optional: true,
        },
        minAppliedAmount: {
          type: 'number',
          optional: true,
        },
        appliedMemberships: {
          type: 'array',
          items: {
            type: 'string',
          },
          optional: true,
        },
        auto: {
          type: 'boolean',
          optional: true,
        },
        campaignName: {
          type: 'string',
          optional: true,
        },
        $$strict: true,
      },
    },
    updateCount: {
      params: {
        id: {
          type: 'string',
        },
      },
    },
  },
};
