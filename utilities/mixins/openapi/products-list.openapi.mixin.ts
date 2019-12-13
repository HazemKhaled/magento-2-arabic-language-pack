import { ServiceSchema } from 'moleculer';

const ProductsListListOpenapi = {
  $path: 'get /products',
  summary: 'Get all Knawat Products',
  tags: ['Products', 'Enterprise Only'],
  responses: {
    '200': {
      description: 'Status 200'
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorBasic'
    }
  },
  security: [
    {
      basicAuth: [] as []
    }
  ]
};

const ProductsListGetOpenapi = {
  $path: 'get /products/{sku}',
  parameters: [
    {
      name: 'sku',
      in: 'path',
      required: true,
      schema: {
        type: 'string'
      }
    }
  ],
  summary: 'Get Product by SKU',
  tags: ['Products', 'Enterprise Only'],
  responses: {
    '200': {
      description: 'Status 200'
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorBasic'
    }
  },
  security: [
    {
      basicAuth: [] as []
    }
  ]
};

export const ProductsListOpenapi: ServiceSchema = {
  name: 'openapi',
  actions: {
    list: {
      openapi: ProductsListListOpenapi
    },
    get: {
      openapi: ProductsListGetOpenapi
    }
  }
};
