import { ServiceSchema } from 'moleculer';

const Payment = {
  type: 'object',
  required: ['amount', 'customer_id', 'date', 'payment_id', 'payment_mode', 'unused_amount'],
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
  description: 'This service available for some Enterprise subscriptions Only',
  tags: ['Payments', 'Enterprise Only'],
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
    401: {
      $ref: '#/components/responses/UnauthorizedErrorBasic',
    },
  },
  security: [
    {
      basicAuth: [] as [],
    },
  ],
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
              description: 'Account id should provide id for account with type bank',
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
      required: false,
      schema: {
        type: 'number',
      },
    },
    {
      name: 'limit',
      in: 'query',
      required: false,
      schema: {
        type: 'number',
      },
    },
    {
      name: 'reference_number',
      in: 'query',
      required: false,
      schema: {
        type: 'string',
      },
    },
    {
      name: 'payment_mode',
      in: 'query',
      required: false,
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
    401: {
      $ref: '#/components/responses/UnauthorizedErrorToken',
    },
  },
  security: [
    {
      bearerAuth: [] as [],
    },
  ],
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
  },
};
