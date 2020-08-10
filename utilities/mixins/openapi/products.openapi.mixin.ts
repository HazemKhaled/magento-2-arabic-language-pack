import { ServiceSchema } from 'moleculer';

const ProductsListListOpenapi = {
  $path: 'get /products',
  summary: 'Get all Knawat Products',
  tags: ['Products'],
  responses: {
    200: {$ref: '#/components/responses/200'},
    401: {$ref: '#/components/responses/UnauthorizedErrorBasic'},
  },
  security: [{basicAuth: [] as any[]}],
};

const ProductsListGetOpenapi = {
  $path: 'get /products/{sku}',
  parameters: [
    {
      name: 'sku',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
      },
    },
  ],
  summary: 'Get Product by SKU',
  tags: ['Products'],
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Product',
          },
        },
      },
    },
    401: {$ref: '#/components/responses/UnauthorizedErrorBasic'},
  },
  security: [{basicAuth: [] as any[]}],
};

const ProductsByVariationOpenapi = {
  $path: 'get /products/variation',
  parameters: [
    {
      name: 'skus',
      in: 'query',
      required: true,
      schema: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  ],
  summary: 'Get Product by Variation SKU',
  tags: ['Products'],
  responses: {
    200: {$ref: '#/components/responses/200'},
    401: {$ref: '#/components/responses/UnauthorizedErrorBasic'},
  },
  security: [{basicAuth: [] as any[]}],
};

export const ProductsOpenapi: ServiceSchema = {
  name: 'products',
  actions: {
    list: {
      openapi: ProductsListListOpenapi,
    },
    getBySku: {
      openapi: ProductsListGetOpenapi,
    },
    getProductsByVariationSku: {
      openapi: ProductsByVariationOpenapi,
    },
  },
  tags: [{
    name: 'Products',
    description:
        'This is how you can get all Knawat products to list it directly on your store, this endpoint for enterprise only customers only',
  }],
};
