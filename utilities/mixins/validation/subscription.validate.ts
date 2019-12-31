import { ServiceSchema } from 'moleculer';


export const SubscriptionValidation: ServiceSchema = {
  name: 'subscription',
  actions: {
    get: {
      params: {
        id: {
          type: 'string',
        },
      },
    },
    list: {
      params: {
        storeId: {
          type: 'string',
          optional: true,
        },
        membershipId: {
          type: 'string',
          optional: true,
        },
        expireDate: [{
          type: 'object',
          optional: true,
          props: {
            operation: {
              type: 'enum',
              values: [
                'lte',
                'gte',
                'gt',
                'lt',
              ],
            },
            date: {
              type: 'date',
              convert: true,
              optional: true,
            },
            $$strict: true,
          },
        },
        {
          type: 'array',
          optional: true,
          max: 2,
          min: 1,
          items: {
            type: 'object',
            props: {
              operation: {
                type: 'enum',
                values: [
                  'lte',
                  'gte',
                  'gt',
                  'lt',
                ],
              },
              date: {
                type: 'date',
                convert: true,
              },
              $$strict: true,
            },
          },
        },
        ],
        startDate: [{
          type: 'object',
          optional: true,
          props: {
            operation: {
              type: 'enum',
              values: [
                'lte',
                'gte',
                'gt',
                'lt',
              ],
            },
            date: {
              type: 'date',
              convert: true,
              optional: true,
            },
            $$strict: true,
          },
        },
        {
          type: 'array',
          optional: true,
          max: 2,
          min: 1,
          items: {
            type: 'object',
            props: {
              operation: {
                type: 'enum',
                values: [
                  'lte',
                  'gte',
                  'gt',
                  'lt',
                ],
              },
              date: {
                type: 'date',
                convert: true,
              },
              $$strict: true,
            },
          },
        },
        ],
        page: {
          type: 'number',
          positive: true,
          optional: true,
        },
        perPage: {
          type: 'number',
          positive: true,
          optional: true,
        },
        sort: {
          type: 'object',
          optional: true,
          props: {
            field: {
              type: 'string',
            },
            order: {
              type: 'enum',
              values: [
                1,
                -1,
              ],
            },
          },
        },
        $$strict: true,
      },
    },
    create: {
      params: {
        storeId: {
          type: 'url',
        },
        membership: {
          type: 'string',
        },
        coupon: {
          type: 'string',
          optional: true,
        },
        $$strict: true,
      },
    },
    getSubscriptionByExpireDate: {
      params: {
        days: 'number',
      },
    },
    updateSubscription: {
      params: {
        id: {
          type: 'string',
        },
        membershipId: {
          type: 'string',
          optional: true,
        },
        storeId: {
          type: 'string',
          optional: true,
        },
        invoiceId: {
          type: 'string',
          optional: true,
        },
        startDate: {
          type: 'date',
          convert: true,
          optional: true,
        },
        expireDate: {
          type: 'date',
          convert: true,
          optional: true,
        },
        autoRenew: {
          type: 'boolean',
          optional: true,
        },
        renewed: {
          type: 'boolean',
          optional: true,
        },
        retries: {
          type: 'array',
          items: {
            type: 'date',
          },
          convert: true,
          optional: true,
        },
        $$strict: true,
      },
    },
    checkCurrentSubGradingStatus: {
      params: {
        id: {
          type: 'string',
        },
      },
    },
  },
};