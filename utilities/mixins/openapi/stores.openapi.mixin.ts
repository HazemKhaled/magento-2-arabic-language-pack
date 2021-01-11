import { ServiceSchema } from 'moleculer';

const StoreSchema = {
  type: 'object',
  required: ['name', 'status', 'type', 'url', 'users'],
  properties: {
    url: {
      type: 'string',
      description: 'URL is the store ID',
      example: 'https://www.example.com/',
    },
    name: {
      type: 'string',
      minLength: 3,
    },
    logo: {
      type: 'string',
      format: 'url',
    },
    status: {
      type: 'string',
      enum: [
        'pending',
        'confirmed',
        'unconfirmed',
        'uninstalled',
        'archived',
        'error',
      ],
      default: 'pending',
    },
    type: {
      type: 'string',
      description: 'Lowercase only allowed',
      enum: [
        'woocommerce',
        'magento2',
        'salla',
        'expandcart',
        'opencart',
        'shopify',
        'csv',
        'ebay',
        'api',
        'catalog',
        'zid',
        'youcan',
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
        taxNumber: {
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
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Store',
          },
        },
      },
    },
    401: { $ref: '#/components/responses/UnauthorizedErrorToken' },
    404: { $ref: '#/components/responses/404' },
  },
  security: [{ bearerAuth: [] as any[] }],
};

const StoresGetOpenapi = {
  $path: 'get /stores/{url}',
  summary: 'Get Store by url',
  tags: ['Stores'],
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
      name: 'withoutBalance',
      in: 'query',
      schema: {
        type: 'boolean',
      },
    },
    {
      name: 'withoutSubscription',
      in: 'query',
      schema: {
        type: 'boolean',
      },
    },
  ],
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Store',
          },
        },
      },
    },
    401: { $ref: '#/components/responses/UnauthorizedErrorBasic' },
    404: { $ref: '#/components/responses/404' },
  },
  security: [{ basicAuth: [] as any[] }],
};

const StoresListOpenapi = {
  $path: 'get /stores',
  summary: 'All User Stores',
  tags: ['Stores'],
  parameters: [
    {
      name: 'offset',
      in: 'query',
      schema: {
        type: 'number',
        description: '',
      },
    },
    {
      name: 'limit',
      in: 'query',
      schema: {
        type: 'number',
        description: '',
      },
    },
    {
      name: 'query',
      in: 'query',
      schema: {
        type: 'string',
        example: '{"users.email":"abdelrahman@knawat.com"}',
      },
    },
    {
      name: 'fields',
      in: 'query',
      schema: {
        type: 'string',
        example: 'name,email,updated,status,users',
        description: 'Pass the name of the fields in comma seperated',
      },
    },
    {
      name: 'sort',
      in: 'query',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'sortOrder',
      in: 'query',
      schema: {
        type: 'string',
        enum: ['ASC', 'DESC'],
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
    401: { $ref: '#/components/responses/UnauthorizedErrorBasic' },
    404: { $ref: '#/components/responses/404' },
  },
  security: [{ basicAuth: [] as any[] }],
};

const StoresSListOpenapi = {
  $path: 'get /stores/admin',
  deprecated: true,
  summary: 'All Stores',
  tags: ['Stores'],
  parameters: [
    {
      name: 'page',
      in: 'query',
      schema: {
        type: 'number',
      },
    },
    {
      name: 'perPage',
      in: 'query',
      schema: {
        type: 'number',
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
    401: { $ref: '#/components/responses/UnauthorizedErrorBasic' },
    404: { $ref: '#/components/responses/404' },
  },
  security: [{ basicAuth: [] as any[] }],
};

const StoresCreateOpenapi = {
  $path: 'post /stores',
  summary: 'Create new store',
  tags: ['Stores'],
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Store',
          },
        },
      },
    },
    401: { $ref: '#/components/responses/UnauthorizedErrorBasic' },
    500: { $ref: '#/components/responses/500' },
  },
  security: [{ basicAuth: [] as any[] }],
  requestBody: {
    $ref: '#/components/requestBodies/Store',
  },
};

const StoresUpdateOpenapi = {
  $path: 'put /stores/{url}',
  summary: 'Update Store by URL',
  tags: ['Stores'],
  parameters: [
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
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Store',
          },
        },
      },
    },
    401: { $ref: '#/components/responses/UnauthorizedErrorBasic' },
    500: { $ref: '#/components/responses/500' },
  },
  security: [{ basicAuth: [] as any[] }],
  requestBody: {
    $ref: '#/components/requestBodies/Store',
  },
};

const MeUpdate = {
  $path: 'put /stores/me',
  summary: 'Update Store',
  tags: ['Stores'],
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Store',
          },
        },
      },
    },
    401: { $ref: '#/components/responses/UnauthorizedErrorToken' },
    500: { $ref: '#/components/responses/500' },
  },
  security: [{ bearerAuth: [] as any[] }],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            logo: {
              type: 'string',
              format: 'url',
            },
            status: {
              type: 'string',
              enum: [
                'pending',
                'confirmed',
                'unconfirmed',
                'uninstalled',
                'archived',
                'error',
              ],
            },
            address: {
              type: 'object',
              properties: {
                first_name: {
                  type: 'string',
                },
                last_name: {
                  type: 'string',
                },
                company: {
                  type: 'string',
                },
                address_1: {
                  type: 'string',
                },
                address_2: {
                  type: 'string',
                },
                city: {
                  type: 'string',
                },
                state: {
                  type: 'string',
                },
                postcode: {
                  type: 'string',
                },
                country: {
                  type: 'string',
                },
                email: {
                  type: 'string',
                  format: 'email',
                },
                phone: {
                  type: 'string',
                },
                taxNumber: {
                  type: 'string',
                },
              },
            },
            currency: {
              type: 'string',
            },
            sale_price: {
              type: 'number',
            },
            sale_price_operator: {
              type: 'number',
              enum: [1, 2],
            },
            compared_at_price: {
              type: 'number',
            },
            compared_at_price_operator: {
              type: 'string',
              enum: [1, 2],
            },
          },
        },
      },
    },
  },
};

const UsersLoginOpenapi = {
  $path: 'post /token',
  summary: 'Get token',
  tags: ['Authentication'],
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            description: 'Channel information',
            properties: {
              channel: {
                type: 'object',
              },
            },
          },
        },
      },
    },
    422: {
      description: 'Status 422',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            description: 'consumerKey or consumerSecret is wrong',
          },
        },
      },
    },
  },
  security: [] as [],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['consumerKey', 'consumerSecret'],
          properties: {
            consumerKey: {
              type: 'string',
            },
            consumerSecret: {
              type: 'string',
            },
          },
        },
      },
    },
    required: true,
  },
};

export const StoresOpenapi: ServiceSchema = {
  name: 'stores',
  settings: {
    openapi: {
      components: {
        schemas: {
          Store: StoreSchema,
        },
        requestBodies: {
          Store: StoreResponse,
        },
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
    create: {
      openapi: StoresCreateOpenapi,
    },
    update: {
      openapi: StoresUpdateOpenapi,
    },
    login: {
      openapi: UsersLoginOpenapi,
    },
    meUpdate: {
      openapi: MeUpdate,
    },
  },
};
