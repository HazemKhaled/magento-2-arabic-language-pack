import { ServiceSchema } from 'moleculer';

const SettingsOpenapi = {
  components: {
    schemas: {
      CustomerGDPR: {
        type: 'object',
        properties: {
          customer: {
            type: 'object',
            properties: {
              email: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

const CustomerRedactOpenapi = {
  $path: 'post /customer/redact',
  summary: 'Customer Redact',
  tags: ['GDPR'],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/CustomerGDPR',
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
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    401: {$ref: '#/components/responses/UnauthorizedErrorToken'},
  },
  security: [{bearerAuth: [] as any[]}],
};

const CustomerDataRequestOpenapi = {
  $path: 'post /customer/data_request',
  summary: 'Customer Data Request',
  tags: ['GDPR'],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/CustomerGDPR',
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
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    401: {$ref: '#/components/responses/UnauthorizedErrorToken'},
  },
  security: [{bearerAuth: [] as any[]}],
};

const StoreRedactOpenapi = {
  $path: 'post /store/redact',
  summary: 'Store Redact',
  tags: ['GDPR'],
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    401: {$ref: '#/components/responses/UnauthorizedErrorToken'},
  },
  security: [{bearerAuth: [] as any[]}],
};

export const GDPROpenapi: ServiceSchema = {
  name: 'gdpr',
  settings: {
    openapi: SettingsOpenapi,
  },
  actions: {
    customerRedact: {
      openapi: CustomerRedactOpenapi,
    },
    storeRedact: {
      openapi: StoreRedactOpenapi,
    },
    customerDataRequest: {
      openapi: CustomerDataRequestOpenapi,
    },
  },
};
