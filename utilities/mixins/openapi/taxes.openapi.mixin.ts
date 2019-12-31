import { ServiceSchema } from 'moleculer';

const TaxSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    country: { type: 'string' },
    'class': { type: 'array', items: { type: 'string' } },
    percentage: { type: 'number' },
  },
};

const TaxCreateReq = {
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', required: true },
          country: { type: 'string', required: true },
          'class': { type: 'array', items: { type: 'string' }, required: true },
          percentage: { type: 'number', required: true },
        },
      },
    },
  },
};

const TaxUpdateReq = {
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', required: true },
          name: { type: 'string' },
          country: { type: 'string' },
          'class': { type: 'array', items: { type: 'string' } },
          percentage: { type: 'number' },
        },
      },
    },
  },
};

const TaxCreate = {
  $path: 'post /tax',
  summary: 'Create new tax',
  tags: ['taxes'],
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
            type: 'object',
            properties: { tax: { $ref: '#/components/schemas/Tax' } },
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
    $ref: '#/components/requestBodies/TaxCreate',
    required: true,
  },
};

const TaxUpdate = {
  $path: 'put /tax',
  summary: 'Update new tax',
  tags: ['taxes'],
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
            type: 'object',
            properties: { tax: { $ref: '#/components/schemas/Tax' } },
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
    $ref: '#/components/requestBodies/TaxUpdate',
    required: true,
  },
};

const TaxFind = {
  $path: 'get /tax/{country}',
  summary: 'get list of taxes by country',
  tags: ['taxes'],
  parameters: [
    {
      name: 'country',
      'in': 'path',
      required: true,
      schema: {
        type: 'string',
      },
    },
    {
      name: 'class',
      'in': 'query',
      schema: {
        type: 'array',
        items: {
          type: 'string',
        },
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
              taxes: {
                type: 'array',
                items: { $ref: '#/components/schemas/Tax' },
              },
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

const TaxDelete = {
  $path: 'delete /tax/{id}',
  summary: 'Delete tax by id',
  tags: ['taxes'],
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
            type: 'array',
            items: { $ref: '#/components/schemas/Tax' },
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

export const TaxOpenapi: ServiceSchema = {
  name: 'taxes',
  settings: {
    components: {
      schemas: {
        Tax: TaxSchema,
      },
      requestBodies: {
        TaxCreate: TaxCreateReq,
        TaxUpdate: TaxUpdateReq,
      },
    },
  },
  actions: {
    tCreate: {
      openapi: TaxCreate,
    },
    tUpdate: {
      openapi: TaxUpdate,
    },
    tFindByCountry: {
      openapi: TaxFind,
    },
    tDelete: {
      openapi: TaxDelete,
    },
  },
};