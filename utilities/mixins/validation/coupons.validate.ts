import { ServiceSchema } from 'moleculer';

export const CouponsValidation: ServiceSchema = {
  name: 'coupons',
  actions: {
    create: {
      params: {
        code: {
          type: 'string',
          pattern: '[A-Z]',
        },
        type: {
          type: 'enum',
          values: ['salesorder', 'subscription'],
        },
        discount: [
          {
            type: 'number',
            positive: true,
          },
          {
            type: 'object',
            props: {
              tax: {
                type: 'object',
                optional: true,
                props: {
                  value: { type: 'number', integer: true },
                  type: { type: 'enum', values: ['%', '$'] },
                  $$strict: true,
                },
              },
              salesorder: {
                type: 'object',
                optional: true,
                props: {
                  value: { type: 'number', integer: true },
                  type: { type: 'enum', values: ['%', '$'] },
                  $$strict: true,
                },
              },
              total: {
                type: 'object',
                optional: true,
                props: {
                  value: { type: 'number', integer: true },
                  type: { type: 'enum', values: ['%', '$'] },
                  $$strict: true,
                },
              },
              $$strict: true,
            },
          },
        ],
        discountType: {
          type: 'enum',
          values: [
            '$',
            '%',
          ],
          optional: true,
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
        appliedMemberships: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        auto: {
          type: 'boolean',
        },
        $$strict: true,
      },
    },
    get: {
      params: {
        id: [{
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
      },
    },
    update: {
      params: {
        id: {
          type: 'string',
        },
        type: {
          type: 'enum',
          values: ['salesorder', 'subscription'],
          optional: true,
        },
        discount: [
          {
            type: 'number',
            positive: true,
            optional: true,
          },
          {
            type: 'object',
            props: {
              tax: {
                type: 'object',
                optional: true,
                props: {
                  value: { type: 'number', integer: true },
                  type: { type: 'enum', values: ['%', '$'] },
                  $$strict: true,
                },
              },
              salesorder: {
                type: 'object',
                optional: true,
                props: {
                  value: { type: 'number', integer: true },
                  type: { type: 'enum', values: ['%', '$'] },
                  $$strict: true,
                },
              },
              total: {
                type: 'object',
                optional: true,
                props: {
                  value: { type: 'number', integer: true },
                  type: { type: 'enum', values: ['%', '$'] },
                  $$strict: true,
                },
              },
              $$strict: true,
            },
            optional: true,
          },
        ],
        discountType: {
          type: 'enum',
          values: [
            '$',
            '%',
          ],
          optional: true,
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
