import { ServiceSchema } from 'moleculer';

const StoreSchema = {
  type: 'object',
  required: ['name', 'status', 'type', 'url', 'users'],
  properties: {
    url: {
      type: 'string',
      description: 'URL is the store ID',
      example: 'https://www.example.com',
    },
    name: {
      type: 'string',
      minLength: 3,
    },
    status: {
      type: 'string',
      enum: ['confirmed', 'unconfirmed', 'archived', 'error'],
    },
    type: {
      type: 'string',
      description: 'Lowercase only allowed',
      enum: [
        'woocommerce',
        'magento2',
        'expandcart',
        'opencart',
        'shopify',
        'csv',
        'ebay',
        'api',
        'other',
      ],
    },
    created: {
      type: 'string',
      format: 'date',
    },
    updated: {
      type: 'string',
      format: 'date',
    },
    stock_date: {
      type: 'string',
      format: 'date',
    },
    stock_status: {
      type: 'string',
      default: 'idle',
      enum: ['idle', 'in-progress'],
    },
    price_date: {
      type: 'string',
      format: 'date',
    },
    price_status: {
      type: 'string',
      default: 'idle',
      enum: ['idle', 'in-progress'],
    },
    sale_price: {
      type: 'number',
      default: 1.7,
      example: '1 = Same as Knawat price',
    },
    compared_at_price: {
      type: 'number',
      default: 2,
      example: '2 = Same as sale price',
    },
    currency: {
      type: 'string',
      description: '3 digit numeric ISO 4217 codes',
      minLength: 3,
      maxLength: 3,
      pattern: '^[A-Z]{3}$',
    },
    consumer_key: {
      type: 'string',
      default: 'Auto generated',
    },
    consumer_secret: {
      type: 'string',
      default: 'Auto generated',
    },
    external_data: {
      type: 'object',
      description: 'Free object to save external IDs, token ... etc',
    },
    internal_data: {
      type: 'object',
      description: 'Free object to save OMS references',
    },
    users: {
      type: 'array',
      description: 'At least one owner should be there in the array',
      items: {
        required: ['email', 'roles'],
        type: 'object',
        properties: {
          email: {
            type: 'string',
          },
          roles: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['owner', 'accounting', 'products', 'orders'],
            },
            minItems: 1,
            maxItems: 4,
          },
        },
      },
    },
    languages: {
      type: 'array',
      items: {
        type: 'string',
        pattern: '^[a-z]{2}-[A-Z]{2}$]',
      },
      minItems: 1,
      maxItems: 10,
    },
    address: {
      required: ['address_1', 'country', 'email', 'first_name', 'last_name'],
      type: 'object',
      properties: {
        first_name: {
          type: 'string',
          minLength: 3,
          pattern: '^[A-Za-z ]{3,}$',
        },
        last_name: {
          type: 'string',
          minLength: 3,
          pattern: '^[A-Za-z ]{3,}$',
        },
        company: {
          type: 'string',
        },
        address_1: {
          type: 'string',
          minLength: 3,
          pattern: '^[A-Za-z0-9 -.,]{3,}$',
        },
        address_2: {
          type: 'string',
          minLength: 3,
          pattern: '^[A-Za-z0-9 -.,]{3,}$',
        },
        city: {
          type: 'string',
          description: 'City or Status, one of them is required',
        },
        state: {
          type: 'string',
          description: 'City or Status, one of them is required',
        },
        postcode: {
          type: 'string',
        },
        country: {
          type: 'string',
          description: 'ISO 3166-1 alpha-2, capital letters only',
          minLength: 2,
          maxLength: 2,
          pattern: '^[A-Z]{2}$',
        },
        email: {
          type: 'string',
        },
        phone: {
          type: 'string',
        },
      },
    },
    debit: {
      type: 'number',
      description: 'Just with /stores/me & /stores/{url}',
    },
    credit: {
      type: 'number',
      description: 'Just with /stores/me & /stores/{url}',
    },
  },
};

const StoreResponse = {
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/Store',
      },
    },
  },
  required: true,
};

const StoresMeOpenapi = {
  $path: 'get /stores/me',
  summary: 'My Store info',
  tags: ['Stores'],
  responses: {
    '200': {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Store',
          },
        },
      },
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorToken',
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
      bearerAuth: [] as [],
    },
  ],
};

const StoresGetOpenapi = {
  $path: 'get /stores/{url}',
  summary: 'Get Store by url',
  tags: ['Stores', 'Enterprise Only'],
  parameters: [
    {
      name: 'Authorization',
      in: 'header',
      required: true,
      schema: {
        type: 'string',
      },
    },

    {
      name: 'url',
      in: 'path',
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
            $ref: '#/components/schemas/Store',
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

const StoresListOpenapi = {
  $path: 'get /stores',
  summary: 'All User Stores',
  tags: ['Stores', 'Enterprise Only'],
  parameters: [
    {
      name: 'filter',
      in: 'query',
      required: false,
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
            type: 'array',
            items: {
              $ref: '#/components/schemas/Store',
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

const StoresSListOpenapi = {
  $path: 'get /admin/stores',
  summary: 'All Stores',
  tags: ['Stores'],
  parameters: [
    {
      name: 'id',
      in: 'query',
      required: false,
      schema: {
        type: 'string',
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
            type: 'object',
            properties: {
              stores: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Store',
                },
              },
              total: { type: 'number' },
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

const StoresCreateOpenapi = {
  $path: 'post /stores',
  summary: 'Create new store',
  tags: ['Stores', 'Enterprise Only'],
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
            $ref: '#/components/schemas/Store',
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
    $ref: '#/components/requestBodies/Store',
  },
};

const StoresUpdateOpenapi = {
  $path: 'put /stores/{url}',
  summary: 'Update Store by URL',
  tags: ['Stores', 'Enterprise Only'],
  parameters: [
    {
      name: 'url',
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
            $ref: '#/components/schemas/Store',
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
    $ref: '#/components/requestBodies/Store',
  },
};

export const StoresOpenapi: ServiceSchema = {
  name: 'stores',
  settings: {
    components: {
      schemas: {
        Store: StoreSchema,
      },
      requestBodies: {
        Store: StoreResponse,
      },
    },
  },
  actions: {
    me: {
      openapi: StoresMeOpenapi,
    },
    get: {
      openapi: StoresGetOpenapi,
    },
    list: {
      openapi: StoresListOpenapi,
    },
    storesList: {
      openapi: StoresSListOpenapi,
    },
    create: {
      openapi: StoresCreateOpenapi,
    },
    update: {
      openapi: StoresUpdateOpenapi,
    },
  },
};
