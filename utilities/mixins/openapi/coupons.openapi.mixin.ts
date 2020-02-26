import { ServiceSchema } from 'moleculer';

const Coupon = {
  type: 'object',
  properties: {
    code: { type: 'string' },
    discount: {
      type: 'object',
      properties: {
        total: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            type: { type: 'string', 'enum': ['%', '$']},
          },
        },
        shipping: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            type: { type: 'string', 'enum': ['%', '$']},
          },
        },
        tax: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            type: { type: 'string', 'enum': ['%', '$']},
          },
        },
      },
    },
    startDate: { type: 'string', format: 'date-time' },
    endDate: { type: 'string', format: 'date-time' },
    maxUses: { type: 'number' },
    appliedMemberships: { type: 'array', items: { type: 'string' } },
    useCount: { type: 'number' },
  },
};

const CouponsGetOpenapi = {
  $path: 'get /coupons/:CODE',
  summary: 'Get Coupon',
  tags: ['Coupon'],
  parameters: [
    {
      name: 'CODE',
      'in': 'path',
      required: true,
      schema: {
        type: 'string',
      },
    },
    {
      name: 'membership',
      'in': 'query',
      required: false,
      schema: {
        type: 'string',
      },
    },
    {
      name: 'type',
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
            $ref: '#/components/schemas/Coupon',
          },
        },
      },
    },
    401: {
      $ref: '#/components/responses/UnauthorizedErrorBasic',
    },
    404: {
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
      basicAuth: [] as any[],
    },
  ],
};

const CouponsCreateOpenapi = {
  $path: 'post /coupons',
  summary: 'Create Coupon',
  tags: ['Coupon'],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Coupon',
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Coupon',
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
      basicAuth: [] as any[],
    },
  ],
};

const CouponsUpdateOpenapi = {
  ...CouponsCreateOpenapi,
  $path: 'put /coupons/:code',
  summary: 'Update Coupon',
};
export const CouponsOpenapi: ServiceSchema = {
  name: 'coupons',
  settings: {
    openapi: {
      components: {
        schemas: {
          Coupon,
        },
      },
    },
  },
  actions: {
    create: {
      openapi: CouponsCreateOpenapi,
    },
    update: {
      openapi: CouponsUpdateOpenapi,
    },
    get: {
      openapi: CouponsGetOpenapi,
    },
  },
};
