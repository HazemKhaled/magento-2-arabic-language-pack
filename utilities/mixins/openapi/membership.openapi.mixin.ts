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
    'public': { type: 'boolean' },
    cost: { type: 'number' },
    discount: { type: 'number' },
    paymentFrequency: { type: 'number' },
    paymentFrequencyType: { type: 'string', 'enum': ['month', 'year'] },
    attributes: { type: 'object', properties: {} },
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
          'public': { type: 'boolean' },
          cost: { type: 'number' },
          discount: { type: 'number' },
          paymentFrequency: { type: 'number' },
          paymentFrequencyType: { type: 'string', 'enum': ['month', 'year'] },
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
            $ref: '#/components/schemas/Membership',
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
      basicAuth: [] as [],
    },
  ],
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
            $ref: '#/components/schemas/Membership',
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
      basicAuth: [] as [],
    },
  ],
  requestBody: {
    $ref: '#/components/requestBodies/Membership',
  },
};

export const MembershipOpenapi: ServiceSchema = {
  name: 'membership',
  settings: {
    components: {
      schemas: {
        Membership: MembershipSchema,
      },
      requestBodies: {
        Membership: MembershipResponse,
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
  },
};