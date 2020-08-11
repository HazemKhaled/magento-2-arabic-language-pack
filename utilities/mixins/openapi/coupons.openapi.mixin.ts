import { ServiceSchema } from 'moleculer';

const CreateCoupon = {
  type: 'object',
  properties: {
    code: {
      type: 'string',
      pattern: '^[A-Z0-9]+$',
    },
    discount: {
      type: 'object',
      properties: {
        total: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            type: { type: 'string', enum: ['%', '$']},
          },
        },
        shipping: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            type: { type: 'string', enum: ['%', '$']},
          },
        },
        tax: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            type: { type: 'string', enum: ['%', '$']},
          },
        },
      },
    },
    type: { type: 'string', enum: ['salesorder', 'subscription'] },
    startDate: { type: 'string', format: 'date-time' },
    endDate: { type: 'string', format: 'date-time' },
    maxUses: { type: 'number' },
    minAppliedAmount: { type: 'number' },
    appliedMemberships: { type: 'array', items: { type: 'string' } },
    auto: { type: 'boolean' },
    campaignName: { type: 'string' },
  },
};

const Coupon = {
  type: 'object',
  properties: {
    ...CreateCoupon.properties,
    useCount: { type: 'number' },
  },
};

const CouponsGetOpenapi = {
  $path: 'get /coupons/{code}',
  summary: 'Get Coupon',
  tags: ['Coupon'],
  parameters: [
    {
      name: 'code',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
        pattern: '^[A-Z0-9]+$',
      },
    },
    {
      name: 'membership',
      in: 'query',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'type',
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
            $ref: '#/components/schemas/Coupon',
          },
        },
      },
    },
    401: {$ref: '#/components/responses/UnauthorizedErrorBasic'},
    404: {$ref: '#/components/responses/404'},
  },
  security: [{basicAuth: [] as any[]}],
};

const CouponsListOpenapi = {
  $path: 'get /coupons',
  summary: 'List Coupons',
  tags: ['Coupon'],
  parameters: [
    {
      name: 'code',
      in: 'query',
      schema: {
        type: 'string',
        pattern: '^[A-Z0-9]+$',
      },
    },
    {
      name: 'membership',
      in: 'query',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'type',
      in: 'query',
      required: true,
      schema: {
        type: 'string',
        enum: ['salesorder', 'subscription'],
      },
    },
  ],
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: { $ref: '#/components/schemas/Coupon' },
          },
        },
      },
    },
    401: {$ref: '#/components/responses/UnauthorizedErrorBasic'},
    404: {$ref: '#/components/responses/404'},
  },
  security: [{basicAuth: [] as any[]}],
};

const CouponsCreateOpenapi = {
  $path: 'post /coupons',
  summary: 'Create Coupon',
  tags: ['Coupon'],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/CreateCoupon',
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
    401: {$ref: '#/components/responses/UnauthorizedErrorBasic'},
  },
  security: [{basicAuth: [] as any[]}],
};

const CouponsUpdateOpenapi = {
  ...CouponsCreateOpenapi,
  $path: 'put /coupons/{code}',
  summary: 'Update Coupon',
  parameters: [
    {
      name: 'code',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
        pattern: '^[A-Z0-9]+$',
      },
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
          CreateCoupon,
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
    list: {
      openapi: CouponsListOpenapi,
    },
  },
};
