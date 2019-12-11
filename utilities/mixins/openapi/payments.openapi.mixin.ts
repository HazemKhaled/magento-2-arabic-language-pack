import { ServiceSchema } from 'moleculer';

const PaymentsAddOpenapi = {
  $path: 'post /payments/{storeId}',
  parameters: [
    {
      name: 'storeId',
      in: 'path',
      required: true,
      schema: {
        type: 'string'
      }
    }
  ],
  summary: 'Add Payment',
  description: 'This service available for some Enterprise subscriptions Only',
  tags: ['Payments', 'Enterprise Only'],
  responses: {
    '200': {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Payment'
          }
        }
      }
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorBasic'
    }
  },
  security: [
    {
      basicAuth: [] as []
    }
  ],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['amount', 'payment_mode'],
          properties: {
            payment_mode: {
              type: 'string'
            },
            amount: {
              type: 'number'
            },
            invoices: {
              type: 'array',
              items: {
                required: ['amount_applied', 'invoice_id'],
                type: 'object',
                properties: {
                  amount_applied: {
                    type: 'number'
                  },
                  invoice_id: {
                    type: 'string'
                  }
                }
              }
            },
            account_id: {
              type: 'string'
            },
            bank_charges: {
              type: 'string',
              description: 'Requires account_id when used'
            }
          }
        }
      }
    },
    required: true
  }
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
        type: 'number'
      }
    },
    {
      name: 'limit',
      in: 'query',
      required: false,
      schema: {
        type: 'number'
      }
    },
    {
      name: 'reference_number',
      in: 'query',
      required: false,
      schema: {
        type: 'string'
      }
    },
    {
      name: 'payment_mode',
      in: 'query',
      required: false,
      schema: {
        type: 'string'
      }
    }
  ],
  responses: {
    '200': {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              payments: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Payment'
                }
              }
            }
          }
        }
      }
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorToken'
    }
  },
  security: [
    {
      bearerAuth: [] as []
    }
  ]
};

export const PaymentsOpenapi: ServiceSchema = {
  name: 'openapi',
  actions: {
    add: {
      openapi: PaymentsAddOpenapi
    },
    get: {
      openapi: PaymentsGetOpenapi
    }
  }
};
