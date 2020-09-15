import { ServiceSchema } from 'moleculer';

import {
  InstanceUpdate,
  DeleteInstanceProduct,
  ProductsImport,
  BulkProductInstance,
} from './products-instances.openapi.mixin';
import { CreateItem, UpdateItem, DeleteItem } from './orders.openapi.mixin';

const commonSchema = {
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['success'],
              },
            },
          },
        },
      },
    },
    401: { $ref: '#/components/responses/UnauthorizedErrorBasic' },
    400: {
      description: 'Bad Request',
    },
    500: {
      description: 'Internal Error.',
    },
  },
};

const AsyncUpdateProductOpenapi = {
  ...InstanceUpdate,
  ...commonSchema,
  tags: ['Async', 'My Products'],
  $path: 'put /async/catalog/products/{sku}',
  summary: 'Update Product by SKU Asynchronously',
};

const AsyncDeleteProductOpenapi = {
  ...DeleteInstanceProduct,
  ...commonSchema,
  tags: ['Async', 'My Products'],
  $path: 'delete /async/catalog/products/{sku}',
  summary: 'Delete product by SKU Asynchronously',
};

const AsyncCreateProductOpenapi = {
  ...ProductsImport,
  ...commonSchema,
  tags: ['Async', 'My Products'],
  $path: 'post /async/catalog/products',
  summary: 'Add to my products Asynchronously',
};

const AsyncPatchProductOpenapi = {
  ...BulkProductInstance,
  ...commonSchema,
  tags: ['Async', 'My Products'],
  $path: 'patch /async/catalog/products',
  summary: 'Bulk update products Asynchronously',
};

const AsyncCreateItemOpenapi = {
  ...CreateItem,
  ...commonSchema,
  tags: ['Async', 'Orders'],
  $path: 'post /async/orders',
  summary: 'Create order Asynchronously',
};

const AsyncUpdateItemOpenapi = {
  ...UpdateItem,
  ...commonSchema,
  tags: ['Async', 'Orders'],
  $path: 'put /async/orders/{order_id}',
  summary: 'Update order Asynchronously',
};

const AsyncDeleteItemOpenapi = {
  ...DeleteItem,
  ...commonSchema,
  tags: ['Async', 'Orders'],
  $path: 'delete /async/orders/{order_id}',
  summary: 'Cancel order Asynchronously',
};

export const TasksOpenapi: ServiceSchema = {
  name: 'async',
  settings: {
    openapi: {
      tags: [
        {
          name: 'Async',
          description:
            'Async endpoint (/async/XXXX) gives facility to do operation Asynchronously.',
        },
      ],
    },
  },
  actions: {
    handle: {
      openapi: [
        AsyncUpdateProductOpenapi,
        AsyncDeleteProductOpenapi,
        AsyncCreateProductOpenapi,
        AsyncPatchProductOpenapi,
        AsyncCreateItemOpenapi,
        AsyncUpdateItemOpenapi,
        AsyncDeleteItemOpenapi,
      ],
    },
  },
};
