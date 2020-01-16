import { ServiceSchema } from 'moleculer';

const InvoiceSchema = {
  type: 'object',
  properties: {
    invoice_id: {
      type: 'string',
    },
    customer_name: {
      type: 'string',
    },
    customer_id: {
      type: 'string',
    },
    status: {
      type: 'string',
    },
    invoice_number: {
      type: 'string',
    },
    reference_number: {
      type: 'string',
    },
    date: {
      type: 'string',
      format: 'date',
    },
    due_date: {
      type: 'string',
      format: 'date',
    },
    due_days: {
      type: 'string',
    },
    total: {
      type: 'number',
    },
    balance: {
      type: 'number',
    },
    created_time: {
      type: 'string',
      format: 'date',
    },
    last_modified_time: {
      type: 'string',
      format: 'date',
    },
    shipping_charge: {
      type: 'number',
    },
    adjustment: {
      type: 'number',
    },
  },
};

const InvoiceResponse = {
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          storeId: { type: 'string' },
          discount: {
            type: 'object',
            properties: {
              value: { type: 'number', positive: true },
              type: { type: 'string', 'enum': ['entity_level'] },
            },
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                sku: { type: 'string' },
                barcode: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                url: { type: 'string' },
                image: { type: 'string' },
                weight: { type: 'number' },
                rate: { type: 'number' },
                quantity: { type: 'number' },
                accountId: { type: 'string' },
                purchaseRate: { type: 'number' },
                vendorId: { type: 'number' },
                taxId: { type: 'string' },
                taxName: { type: 'string' },
                taxType: { type: 'string' },
                taxPercentage: { type: 'number' },
              },
            },
          },
        },
      },
    },
  },
};

const InvoicesGetOpenapi = {
  $path: 'get /invoices',
  summary: 'List Invoices',
  tags: ['Invoices'],
  parameters: [
    {
      name: 'page',
      'in': 'query',
      required: false,
      schema: {
        type: 'number',
      },
    },
    {
      name: 'limit',
      'in': 'query',
      required: false,
      schema: {
        type: 'number',
      },
    },
    {
      name: 'reference_number',
      'in': 'query',
      required: false,
      schema: {
        type: 'string',
      },
    },
    {
      name: 'invoice_number',
      'in': 'query',
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
              invoices: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Invoice',
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
      bearerAuth: [] as any[],
    },
  ],
};

const InvoicesCreateOpenapi = {
  $path: 'post /invoices',
  summary: 'Create new invoice',
  tags: ['Invoices'],
  parameters: [
    {
      name: 'Authorization',
      'in': 'header',
      required: true,
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
            $ref: '#/components/schemas/Invoice',
          },
        },
      },
    },
    401: {
      $ref: '#/components/responses/UnauthorizedErrorBasic',
    },
    500: {
      description: 'Status 500',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
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
  security: [
    {
      basicAuth: [] as any[],
    },
  ],
  requestBody: {
    $ref: '#/components/requestBodies/Invoice',
    required: true,
  },
};

const InvoicesApplyCreditsOpenapi = {
  $path: 'post /invoices/{id}/credits',
  summary: 'Apply credits to invoice',
  tags: ['Invoices'],
  parameters: [
    {
      name: 'id',
      'in': 'path',
      required: true,
      schema: {
        type: 'string',
      },
    },
    {
      name: 'Authorization',
      'in': 'header',
      required: true,
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
              invoicePayments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    invoicePaymentId: { type: 'string' },
                    paymentId: { type: 'string' },
                    invoiceId: { type: 'string' },
                    amountUsed: { type: 'number' },
                  },
                },
              },
              code: { type: 'number' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    401: {
      $ref: '#/components/responses/UnauthorizedErrorBasic',
    },
    500: {
      description: 'Status 500',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
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
  security: [
    {
      basicAuth: [] as any[],
    },
  ],
};

export const InvoicesOpenapi: ServiceSchema = {
  name: 'invoices',
  settings: {
    openapi: {
      components: {
        schemas: {
          Invoice: InvoiceSchema,
        },
        requestBodies: {
          Invoice: InvoiceResponse,
        },
      },
    },
  },
  actions: {
    get: {
      openapi: InvoicesGetOpenapi,
    },
    create: {
      openapi: InvoicesCreateOpenapi,
    },
    applyCredits: {
      openapi: InvoicesApplyCreditsOpenapi,
    },
  },
};
