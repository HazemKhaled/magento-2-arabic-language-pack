import { ServiceSchema } from 'moleculer';

const Coupon = {
  type: 'object',
  properties: {
    code: { type: 'string' },
    discount: { type: 'number' },
    discountType: { type: 'string', 'enum': ['$', '%'] },
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
    get: {
      openapi: CouponsGetOpenapi,
    },
  },
};
