import { ServiceSchema } from 'moleculer';

const checkoutValueProps = {
  currency_code: {
    type: 'string',
    min: 3,
  },
  value: {
    type: 'number',
    convert: true,
  },
};

export const PaymentsValidation: ServiceSchema = {
  name: 'payments',
  actions: {
    add: {
      params: {
        id: [
          {
            type: 'string',
          },
          {
            type: 'number',
            integer: true,
          },
        ],
        payment_mode: {
          type: 'string',
        },
        amount: {
          type: 'number',
        },
        invoices: {
          type: 'array',
          item: {
            type: 'object',
            props: {
              amount_applied: {
                type: 'number',
                convert: true,
              },
              invoice_id: {
                type: 'string',
              },
            },
          },
          optional: true,
        },
        account_id: {
          type: 'string',
        },
        bank_charges: {
          type: 'number',
          optional: true,
          convert: true,
        },
        reference: [
          {
            type: 'string',
          },
          {
            type: 'number',
            integer: true,
          },
        ],
        description: {
          type: 'string',
          optional: true,
        },
      },
    },
    get: {
      params: {
        page: {
          type: 'number',
          integer: true,
          optional: true,
          convert: true,
        },
        limit: {
          type: 'number',
          integer: true,
          optional: true,
          convert: true,
        },
        reference_number: {
          type: 'string',
          optional: true,
        },
        payment_mode: {
          type: 'string',
          optional: true,
        },
      },
    },
    checkout: {
      params: {
        store: {
          type: 'string',
        },
        hmac: {
          type: 'string',
        },
        purchase_units: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              description: {
                type: 'string',
                optional: true,
              },
              type: {
                type: 'enum',
                optional: true,
                values: ['order', 'subscription', 'charge'],
              },
              amount: {
                type: 'object',
                props: {
                  ...checkoutValueProps,
                  breakdown: {
                    type: 'object',
                    optional: true,
                    props: {
                      item_total: {
                        type: 'object',
                        optional: true,
                        props: checkoutValueProps,
                      },
                      shipping: {
                        type: 'object',
                        optional: true,
                        props: checkoutValueProps,
                      },
                      tax_total: {
                        type: 'object',
                        optional: true,
                        props: checkoutValueProps,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
