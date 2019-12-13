import { ServiceSchema } from 'moleculer';

const SubscriptionSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    membershipId: { type: 'string' },
    storeId: { type: 'string' },
    invoiceId: { type: 'string' },
    startDate: { type: 'string', format: 'date-time' },
    expireDate: { type: 'string', format: 'date-time' },
    autoRenew: { type: 'boolean' },
    renewed: { type: 'boolean' },
    retries: { type: 'array', items: { type: 'string', format: 'date-time' } },
  },
};

const SubscriptionResponse = {
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          membershipId: { type: 'string' },
          storeId: { type: 'string' },
          invoiceId: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          expireDate: { type: 'string', format: 'date-time' },
          autoRenew: { type: 'boolean' },
          renewed: { type: 'boolean' },
          retries: { type: 'array', items: { type: 'string', format: 'date-time' } },
        },
      },
    },
  },
};

const SubscriptionListOpenapi = {
  $path: 'get /subscription',
  summary: 'List subscription',
  tags: ['Subscription'],
  parameters: [
    {
      name: 'storeId',
      in: 'query',
      required: false,
      schema: {
        type: 'string',
      },
    },
    {
      name: 'membershipId',
      in: 'query',
      required: false,
      schema: {
        type: 'string',
      },
    },
    {
      name: 'expireDate',
      in: 'query',
      schema: {
        type: 'array',
        max: 2,
        min: 1,
        items: {
          type: 'object',
          properties: {
            operation: { type: 'string', values: ['lte', 'gte', 'gt', 'lt'] },
            date: { type: 'date' },
          },
        },
      },
    },
    {
      name: 'startDate',
      in: 'query',
      schema: {
        type: 'array',
        max: 2,
        min: 1,
        items: {
          type: 'object',
          properties: {
            operation: { type: 'string', enum: ['lte', 'gte', 'gt', 'lt'] },
            date: { type: 'date' },
          },
        },
      },
    },
    {
      name: 'page',
      in: 'query',
      required: false,
      schema: {
        type: 'number',
      },
    },
    {
      name: 'perPage',
      in: 'query',
      required: false,
      schema: {
        type: 'number',
      },
    },
    {
      name: 'sort',
      in: 'query',
      schema: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          order: { type: 'number', enum: [1, -1] },
        },
      },
    },
    {
      name: 'Authorization',
      in: 'header',
      required: true,
      schema: {
        type: 'string',
      },
    },
  ],
  responses: {
    '200': {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Subscription',
            },
          },
        },
      },
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorBasic',
    },
    '404': {
      description: 'Status 404',
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
      basicAuth: [] as [],
    },
  ],
};

const SubscriptionCreateOpenapi = {
  $path: 'post /subscription',
  summary: 'Create new Subscription',
  tags: ['Subscription'],
  parameters: [
    {
      name: 'Authorization',
      in: 'header',
      required: true,
      schema: {
        type: 'string',
      },
    },
  ],
  responses: {
    '200': {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Subscription',
          },
        },
      },
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorBasic',
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
      basicAuth: [] as [],
    },
  ],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            storeId: { type: 'string', format: 'url', required: true },
            membership: { type: 'string', required: true },
            coupon: { type: 'string' },
          },
        },
      },
    },
    required: true,
  },
};

const SubscriptionUpdateOpenapi = {
  $path: 'put /subscription/{id}',
  summary: 'Update Store Subscription',
  tags: ['Subscription'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
      },
    },
    {
      name: 'Authorization',
      in: 'header',
      required: true,
      schema: {
        type: 'string',
      },
    },
  ],
  responses: {
    '200': {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Subscription',
          },
        },
      },
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorBasic',
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
      basicAuth: [] as [],
    },
  ],
  requestBody: {
    $ref: '#/components/requestBodies/Subscription',
  },
};

export const SubscriptionOpenapi: ServiceSchema = {
  name: 'subscription',
  settings: {
    components: {
      schemas: {
        Subscription: SubscriptionSchema,
      },
      requestBodies: {
        subscription: SubscriptionResponse,
      },
    },
  },
  actions: {
    list: {
      openapi: SubscriptionListOpenapi,
    },
    create: {
      openapi: SubscriptionCreateOpenapi,
    },
    updateSubscription: {
      openapi: SubscriptionUpdateOpenapi,
    },
  },
};
