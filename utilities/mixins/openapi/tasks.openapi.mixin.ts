import { ServiceSchema } from 'moleculer';

import {
  InstanceUpdate,
  DeleteInstanceProduct,
  ProductsImport,
  BulkProductInstance,
} from './products-instances.openapi.mixin';
import { CreateItem, UpdateItem, DeleteItem } from './orders.openapi.mixin';

const commonSchema = {
  tags: ['Async'],
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
  $path: 'put /async/catalog/products/{sku}',
  summary: 'Update Product by SKU Asynchronously',
};

const AsyncDeleteProductOpenapi = {
  ...DeleteInstanceProduct,
  ...commonSchema,
  $path: 'delete /async/catalog/products/{sku}',
  summary: 'Delete product by SKU Asynchronously',
};

const AsyncCreateProductOpenapi = {
  ...ProductsImport,
  ...commonSchema,
  $path: 'post /async/catalog/products',
  summary: 'Add to my products Asynchronously',
};

const AsynPatchProductOpenapi = {
  ...BulkProductInstance,
  ...commonSchema,
  $path: 'patch /async/catalog/products',
  summary: 'Bulk update products Asynchronously',
};

const AsyncCreateItemOpenapi = {
  ...CreateItem,
  ...commonSchema,
  $path: 'post /async/orders',
  summary: 'Create order Asynchronously',
};

const AsyncUpdateItemOpenapi = {
  ...UpdateItem,
  ...commonSchema,
  $path: 'put /async/orders/{order_id}',
  summary: 'Update order Asynchronously',
};

const AsyncDeleteItemOpenapi = {
  ...DeleteItem,
  ...commonSchema,
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
        AsynPatchProductOpenapi,
        AsyncCreateItemOpenapi,
        AsyncUpdateItemOpenapi,
        AsyncDeleteItemOpenapi,
      ],
    },
  },
};
