import { ServiceSchema } from 'moleculer';

const MembershipSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: {
      type: 'object',
      properties: {
        tr: { type: 'string' },
        en: { type: 'string' },
        ar: { type: 'string' },
      },
    },
    tagline: {
      type: 'object',
      properties: {
        tr: { type: 'string' },
        en: { type: 'string' },
        ar: { type: 'string' },
      },
    },
    description: {
      type: 'object',
      properties: {
        tr: { type: 'string' },
        en: { type: 'string' },
        ar: { type: 'string' },
      },
    },
    sort: { type: 'number' },
    active: { type: 'boolean' },
    public: { type: 'boolean' },
    cost: { type: 'number' },
    discount: { type: 'number' },
    paymentFrequency: { type: 'number' },
    paymentFrequencyType: { type: 'string', enum: ['month', 'year'] },
    attributes: { type: 'object', properties: {} },
    coupon: {
      $ref: '#/components/schemas/Coupon',
      readOnly: true,
      description:
        'This field is returned with the response added when a coupon is applied to the membership',
    },
    originalDiscount: {
      type: 'number',
      readOnly: true,
      description:
        'This field is only returned with the response when a coupon is applied to the membership',
    },
    totals: {
      type: 'object',
      readOnly: true,
      properties: {
        cost: { type: 'number' },
        taxData: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            country: { type: 'string' },
            class: { type: 'array', items: { type: 'string' } },
            percentage: { type: 'number' },
            isInclusive: { type: 'boolean' },
            omsId: { type: 'string' },
            value: { type: 'number' },
          },
        },
      },
    },
  },
};

const MembershipResponse = {
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'object',
            properties: {
              tr: { type: 'string' },
              en: { type: 'string' },
              ar: { type: 'string' },
            },
          },
          tagline: {
            type: 'object',
            properties: {
              tr: { type: 'string' },
              en: { type: 'string' },
              ar: { type: 'string' },
            },
          },
          description: {
            type: 'object',
            properties: {
              tr: { type: 'string' },
              en: { type: 'string' },
              ar: { type: 'string' },
            },
          },
          sort: { type: 'number' },
          active: { type: 'boolean' },
          public: { type: 'boolean' },
          cost: { type: 'number' },
          discount: { type: 'number' },
          paymentFrequency: { type: 'number' },
          paymentFrequencyType: { type: 'string', enum: ['month', 'year'] },
          attributes: { type: 'object', properties: {} },
        },
      },
    },
  },
};

const MembershipCreateOpenapi = {
  $path: 'post /membership',
  summary: 'Create new membership',
  tags: ['Membership'],
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Membership',
          },
        },
      },
    },
    401: { $ref: '#/components/responses/UnauthorizedErrorBasic' },
    500: { $ref: '#/components/responses/500' },
  },
  security: [{ basicAuth: [] as any[] }],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Membership',
        },
      },
    },
    required: true,
  },
};

const MembershipUpdateOpenapi = {
  $path: 'put /membership/{id}',
  summary: 'Update Membership',
  tags: ['Membership'],
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
      name: 'country',
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
            $ref: '#/components/schemas/Membership',
          },
        },
      },
    },
    401: { $ref: '#/components/responses/UnauthorizedErrorBasic' },
    500: { $ref: '#/components/responses/500' },
  },
  security: [{ basicAuth: [] as any[] }],
  requestBody: {
    $ref: '#/components/requestBodies/Membership',
  },
};

const MembershipGetOpenapi = {
  $path: 'get /membership/{id}',
  summary: 'Get Membership By id',
  tags: ['Membership'],
  description: 'Gets Membership',
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
      name: 'country',
      in: 'query',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'coupon',
      in: 'query',
      schema: {
        type: 'string',
        description: 'Coupon code to be applied to the membership discount',
      },
    },
  ],
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Membership',
          },
        },
      },
    },
    401: { $ref: '#/components/responses/UnauthorizedErrorBasic' },
    500: { $ref: '#/components/responses/500' },
  },
  security: [{ basicAuth: [] as any[] }],
};

const MembershipListOpenapi = {
  $path: 'get /membership',
  summary: 'List Memberships',
  tags: ['Membership'],
  description: 'Get all Memberships',
  parameters: [
    {
      name: 'country',
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
            type: 'array',
            items: {
              $ref: '#/components/schemas/Membership',
            },
          },
        },
      },
    },
    401: { $ref: '#/components/responses/UnauthorizedErrorBasic' },
    500: { $ref: '#/components/responses/500' },
  },
  security: [{ basicAuth: [] as any[] }],
};

export const MembershipOpenapi: ServiceSchema = {
  name: 'membership',
  settings: {
    openapi: {
      components: {
        schemas: {
          Membership: MembershipSchema,
        },
        requestBodies: {
          Membership: MembershipResponse,
        },
      },
    },
  },
  actions: {
    create: {
      openapi: MembershipCreateOpenapi,
    },
    update: {
      openapi: MembershipUpdateOpenapi,
    },
    mGet: {
      openapi: MembershipGetOpenapi,
    },
    list: {
      openapi: MembershipListOpenapi,
    },
  },
};
