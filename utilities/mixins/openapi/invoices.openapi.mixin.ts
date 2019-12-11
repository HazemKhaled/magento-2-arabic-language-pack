import { ServiceSchema } from 'moleculer';

const InvoicesGetOpenapi = {
  $path: 'get /invoices',
  summary: 'List Invoices',
  tags: ['Invoices'],
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
      name: 'invoice_number',
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
              invoices: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Invoice'
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
      bearerAuth: [] as any[]
    }
  ]
};

const InvoicesCreateOpenapi = {
  $path: 'post /invoices',
  summary: 'Create new invoice',
  tags: ['Invoices'],
  parameters: [
    {
      name: 'Authorization',
      in: 'header',
      required: true,
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
            $ref: '#/components/schemas/Invoice'
          }
        }
      }
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorBasic'
    },
    '500': {
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
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  security: [
    {
      basicAuth: [] as any[]
    }
  ],
  requestBody: {
    $ref: '#/components/requestBodies/Invoice',
    required: true
  }
};

const InvoicesApplyCreditsOpenapi = {
  $path: 'post /invoices/{id}/credits',
  summary: 'Apply credits to invoice',
  tags: ['Invoices'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: {
        type: 'string'
      }
    },
    {
      name: 'Authorization',
      in: 'header',
      required: true,
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
              invoicePayments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    invoicePaymentId: { type: 'string' },
                    paymentId: { type: 'string' },
                    invoiceId: { type: 'string' },
                    amountUsed: { type: 'number' }
                  }
                }
              },
              code: { type: 'number' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorBasic'
    },
    '500': {
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
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  security: [
    {
      basicAuth: [] as any[]
    }
  ]
};

export const InvoicesOpenapi: ServiceSchema = {
  name: 'openapi',
  actions: {
    get: {
      openapi: InvoicesGetOpenapi
    },
    create: {
      openapi: InvoicesCreateOpenapi
    },
    applyCredits: {
      openapi: InvoicesApplyCreditsOpenapi
    }
  }
};
