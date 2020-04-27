import { ServiceSchema } from 'moleculer';

const InvoiceResponse = {
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
    coupon: {
      type: 'string',
      required: false,
    },
  },
};

const InvoiceSchema = {
  type: 'object',
  properties: {
    storeId: { type: 'string' },
    discount: {
      type: 'object',
      properties: {
        value: { type: 'number', positive: true, required: true },
        type: { type: 'string', 'enum': ['entity_level'], required: true },
      },
    },
    coupon: { type: 'string', required: false },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          sku: { type: 'string', required: true },
          barcode: { type: 'string', required: false },
          name: { type: 'string', required: true },
          description: { type: 'string', required: false },
          url: { type: 'string', required: false },
          image: { type: 'string', required: false },
          weight: { type: 'number', required: false },
          rate: { type: 'number', required: true },
          quantity: { type: 'number', required: true },
          accountId: { type: 'string', required: false },
          purchaseRate: { type: 'number', required: false },
          vendorId: { type: 'number', required: false },
          taxId: { type: 'string', required: false },
          taxName: { type: 'string', required: false },
          taxType: { type: 'string', required: false },
          taxPercentage: { type: 'number', required: false },
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
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/requestBodies/Invoice',
        },
      },
    },
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
      bearerAuth: [] as any[],
    },
  ],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            useSavedPaymentMethods: {
              type: 'boolean',
              required: true,
            },
            paymentAmount: {
              type: 'number',
              required: true,
            },
          },
        },
      },
    },
  },
};

export const InvoicesOpenapi: ServiceSchema = {
  name: 'invoices',
  settings: {
    openapi: {
      components: {
        schemas: {
          Invoice: InvoiceResponse,
        },
        requestBodies: {
          Invoice: InvoiceSchema,
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
    renderInvoice: {
      openapi: {
        $path: 'get /invoice/{storeId}/external/{id}',
        summary: 'Get HTML invoice',
        tags: ['Invoices'],
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
      },
    },
  },
};
