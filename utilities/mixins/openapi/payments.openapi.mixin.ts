import { ServiceSchema } from 'moleculer';

const Payment = {
  type: 'object',
  required: [
    'amount',
    'customer_id',
    'date',
    'payment_id',
    'payment_mode',
    'unused_amount',
  ],
  properties: {
    payment_id: {
      type: 'string',
    },
    customer_id: {
      type: 'string',
    },
    payment_mode: {
      type: 'string',
    },
    amount: {
      type: 'number',
    },
    unused_amount: {
      type: 'number',
    },
    invoices: {
      type: 'array',
      items: {
        required: ['amount_applied', 'invoice_id'],
        type: 'object',
        properties: {
          amount_applied: {
            type: 'number',
          },
          invoice_id: {
            type: 'string',
          },
        },
      },
    },
    bank_charges: {
      type: 'number',
    },
    date: {
      type: 'string',
      format: 'date',
    },
    account_id: {
      type: 'string',
    },
    account_name: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
  },
};

const PaymentsAddOpenapi = {
  $path: 'post /payments/{storeId}',
  parameters: [
    {
      name: 'storeId',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
      },
    },
  ],
  summary: 'Add Payment',
  tags: ['Payments'],
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Payment',
          },
        },
      },
    },
    401: { $ref: '#/components/responses/UnauthorizedErrorBasic' },
  },
  security: [{ basicAuth: [] as any[] }],
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['amount', 'payment_mode', 'reference'],
          properties: {
            payment_mode: {
              type: 'string',
            },
            amount: {
              type: 'number',
            },
            invoices: {
              type: 'array',
              items: {
                required: ['amount_applied', 'invoice_id'],
                type: 'object',
                properties: {
                  amount_applied: {
                    type: 'number',
                  },
                  invoice_id: {
                    type: 'string',
                  },
                },
              },
            },
            account_id: {
              type: 'string',
            },
            bank_charges: {
              type: 'number',
              description:
                'Account id should provide id for account with type bank',
            },
            reference: {
              type: 'string',
              description: 'Payment gateway reference id',
            },
            description: {
              type: 'string',
            },
          },
        },
      },
    },
  },
};

const PaymentsGetOpenapi = {
  $path: 'get /payments',
  summary: 'List Payments',
  tags: ['Payments'],
  parameters: [
    {
      name: 'page',
      in: 'query',
      schema: {
        type: 'number',
      },
    },
    {
      name: 'limit',
      in: 'query',
      schema: {
        type: 'number',
      },
    },
    {
      name: 'reference_number',
      in: 'query',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'payment_mode',
      in: 'query',
      schema: {
        type: 'string',
      },
    },
  ],
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              payments: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Payment',
                },
              },
            },
          },
        },
      },
    },
    401: { $ref: '#/components/responses/UnauthorizedErrorToken' },
  },
  security: [{ bearerAuth: [] as any[] }],
};

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

const PaymentsCheckoutOpenapi = {
  $path: 'get /checkout',
  summary: 'Checkout Gateway',
  tags: ['Payments'],
  parameters: [
    {
      name: 'store',
      in: 'query',
      type: 'string',
      required: true,
    },
    {
      name: 'hmac',
      in: 'query',
      type: 'string',
      required: true,
    },
    {
      name: 'purchase_units',
      in: 'query',
      type: 'array',
      required: true,
      items: {
        type: 'object',
        properties: {
          ...checkoutValueProps,
          description: {
            type: 'string',
          },
          type: {
            type: 'enum',
            values: ['order', 'subscription', 'charge'],
          },
          breakdown: {
            type: 'object',
            properties: {
              item_total: {
                type: 'object',
                properties: checkoutValueProps,
              },
              shipping: {
                type: 'object',
                properties: checkoutValueProps,
              },
              tax_total: {
                type: 'object',
                properties: checkoutValueProps,
              },
            },
          },
        },
      },
    },
  ],
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'text/html': {
          schema: {
            type: 'string',
          },
        },
      },
    },
    401: { $ref: '#/components/responses/UnauthorizedErrorBasic' },
    422: { $ref: '#/components/responses/UnauthorizedErrorBasic' },
    500: { $ref: '#/components/responses/500' },
  },
  security: [{ hmac: [] as any[] }],
};

export const PaymentsOpenapi: ServiceSchema = {
  name: 'payments',
  settings: {
    openapi: {
      components: {
        schemas: {
          Payment,
        },
      },
    },
  },
  actions: {
    add: {
      openapi: PaymentsAddOpenapi,
    },
    get: {
      openapi: PaymentsGetOpenapi,
    },
    checkout: {
      openapi: PaymentsCheckoutOpenapi,
    },
  },
};
