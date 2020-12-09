import { ServiceSchema } from 'moleculer';

export const SubscriptionValidation: ServiceSchema = {
  name: 'subscription',
  actions: {
    getByStore: {
      params: {
        storeId: {
          type: 'string',
        },
      },
    },
    getAll: {
      params: {
        storeId: {
          type: 'string',
          optional: true,
        },
        membershipId: {
          type: 'string',
          optional: true,
        },
        expireDate: [
          {
            type: 'object',
            strict: true,
            optional: true,
            props: {
              operation: {
                type: 'enum',
                values: ['lte', 'gte', 'gt', 'lt'],
              },
              date: {
                type: 'date',
                convert: true,
                optional: true,
              },
            },
          },
          {
            type: 'array',
            optional: true,
            max: 2,
            min: 1,
            items: {
              type: 'object',
              strict: true,
              props: {
                operation: {
                  type: 'enum',
                  values: ['lte', 'gte', 'gt', 'lt'],
                },
                date: {
                  type: 'date',
                  convert: true,
                },
              },
            },
          },
        ],
        startDate: [
          {
            type: 'object',
            strict: true,
            optional: true,
            props: {
              operation: {
                type: 'enum',
                values: ['lte', 'gte', 'gt', 'lt'],
              },
              date: {
                type: 'date',
                convert: true,
                optional: true,
              },
            },
          },
          {
            type: 'array',
            optional: true,
            max: 2,
            min: 1,
            items: {
              type: 'object',
              strict: true,
              props: {
                operation: {
                  type: 'enum',
                  values: ['lte', 'gte', 'gt', 'lt'],
                },
                date: {
                  type: 'date',
                  convert: true,
                },
              },
            },
          },
        ],
        status: {
          type: 'enum',
          values: ['active', 'confirmed', 'pending', 'cancelled'],
          optional: true,
        },
        reference: {
          type: 'string',
          optional: true,
        },
        page: {
          type: 'number',
          positive: true,
          convert: true,
          optional: true,
        },
        perPage: {
          type: 'number',
          positive: true,
          convert: true,
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
              values: [1, -1],
            },
          },
        },
        $$strict: true,
      },
    },
    createOne: {
      params: {
        storeId: {
          type: 'url',
        },
        membership: {
          type: 'string',
        },
        reference: {
          type: 'string',
          optional: true,
        },
        postpaid: {
          type: 'enum',
          values: [1],
          optional: true,
        },
        date: {
          type: 'object',
          strict: true,
          optional: true,
          props: {
            start: {
              type: 'string',
              pattern: /^(20[1-9][0-9])-((0[1-9])|(1(0|1|2)))-(((0[1-9])|(1|2)[0-9])|3(0|1))$/,
            },
            expire: {
              type: 'string',
              pattern: /^(20[1-9][0-9])-((0[1-9])|(1(0|1|2)))-(((0[1-9])|(1|2)[0-9])|3(0|1))$/,
            },
          },
        },
        coupon: {
          type: 'string',
          optional: true,
        },
        grantTo: {
          type: 'url',
          optional: true,
        },
        autoRenew: {
          type: 'boolean',
          optional: true,
        },
        dueDate: {
          type: 'string',
          optional: true,
          pattern: /^(20[1-9][0-9])-((0[1-9])|(1(0|1|2)))-(((0[1-9])|(1|2)[0-9])|3(0|1))$/,
        },
        $$strict: true,
      },
    },
    getOneByExpireDate: {
      params: {
        afterDays: { type: 'number', optional: true },
        beforeDays: { type: 'number', optional: true },
      },
    },
    updateOne: {
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
    cancel: {
      params: {
        id: 'string',
      },
    },
  },
};
