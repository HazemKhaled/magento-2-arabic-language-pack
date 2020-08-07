import { ServiceSchema } from 'moleculer';

const Order = {
  type: 'object',
  required: ['items', 'orderNumber', 'shipping', 'status'],
  properties: {
    id: {
      type: 'string',
      description: 'Order External ID',
    },
    status: {
      type: 'string',
      enum: ['pending', 'processing', 'cancelled'],
    },
    items: {
      type: 'array',
      items: {
        required: ['quantity', 'sku'],
        type: 'object',
        properties: {
          quantity: {
            type: 'number',
            minimum: 1,
            maximum: 10,
          },
          sku: {
            type: 'string',
          },
        },
      },
      minItems: 1,
    },
    shipping: {
      required: ['address_1', 'city', 'country', 'first_name', 'last_name', 'state'],
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
          description: 'ISO 3166-1 alpha-2 codes are two-letter country codes',
          minLength: 2,
          maxLength: 2,
          example: 'TR',
        },
        email: {
          type: 'string',
        },
        phone: {
          type: 'string',
        },
      },
    },
    invoice_url: {
      type: 'string',
      description: 'Optional invoice to print with the order',
    },
    notes: {
      type: 'string',
    },
    shipping_method: {
      type: 'string',
    },
    orderNumber: {
      type: 'string',
    },
    trackingNumber: {
      type: 'string',
    },
    coupon: {
      type: 'string',
    },
  },
  example: {
    id: '12763',
    status: 'pending',
    items: [
      {
        quantity: 1,
        sku: 'H3576AZ17HSNM13-XS',
      },
    ],
    shipping: {
      first_name: 'John',
      last_name: 'Doe',
      company: 'Knawat',
      address_1: 'Halaskargazi Mahallesi, D10 KAT5 Cd, Rumeli Cd. 35-37',
      address_2: '',
      city: 'Şişli',
      state: 'İstanbul',
      postcode: '34371',
      country: 'TR',
      email: 'info@knawat.com',
      phone: '(0212) 296 11 94',
    },
    invoice_url: 'http://example.com/invoice.pdf',
    notes: 'My Orders',
    coupon: 'TEST',
  },
};
const OrderResponse = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['success', 'fail'],
    },
    order: {
      type: 'object',
      required: ['items', 'orderNumber', 'shipping', 'status', 'total'],
      properties: {
        id: {
          type: 'string',
          description: 'Order External ID',
        },
        status: {
          type: 'string',
          enum: ['pending', 'processing', 'cancelled'],
        },
        items: {
          type: 'array',
          items: {
            required: ['quantity', 'sku'],
            type: 'object',
            properties: {
              quantity: {
                type: 'number',
                minimum: 1,
                maximum: 10,
              },
              sku: {
                type: 'string',
              },
            },
          },
          minItems: 1,
        },
        shipping: {
          required: ['address_1', 'city', 'country', 'first_name', 'last_name', 'state'],
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
              description: 'ISO 3166-1 alpha-2 codes are two-letter country codes',
              minLength: 2,
              maxLength: 2,
              example: 'TR',
            },
            email: {
              type: 'string',
            },
            phone: {
              type: 'string',
            },
          },
        },
        invoice_url: {
          type: 'string',
          description: 'Optional invoice to print with the order',
        },
        notes: {
          type: 'string',
        },
        shipping_method: {
          type: 'string',
        },
        shipment_date: {
          type: 'string',
        },
        orderNumber: {
          type: 'string',
        },
        trackingNumber: {
          type: 'string',
        },
        coupon: {
          type: 'string',
        },
        total: {
          type: 'number',
        },
        discount: {
          type: 'number',
        },
        warnings: {
          type: 'string',
          readOnly: true,
          required: false,
        },
        warningsSnippet: {
          type: 'string',
          readOnly: true,
        },
        financialStatus: {
          type: 'string',
          readOnly: true,
        },
        fulfillmentStatus: {
          type: 'string',
          readOnly: true,
        },
      },
    },
    warning: {
      type: 'array',
      items: {
        required: ['message'],
        type: 'object',
        properties: {
          message: {
            type: 'string',
          },
          code: {
            type: 'number',
            example: '1102 => This items are out of stock',
          },
          skus: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
      },
    },
    errors: {
      type: 'array',
      items: {
        required: ['message', 'status'],
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['fail'],
          },
          message: {
            type: 'string',
          },
          solution: {
            type: 'string',
          },
          code: {
            type: 'number',
            example:
              '1101 => The products you ordered is not in-stock, The order has not been created!',
          },
        },
      },
    },
  },
  example: {
    status: 'success',
    order: {
      id: '12763',
      status: 'pending',
      items: [
        {
          quantity: 1,
          sku: 'H3576AZ17HSNM13-XS',
        },
      ],
      shipping: {
        first_name: 'John',
        last_name: 'Doe',
        company: 'Knawat',
        address_1: 'Halaskargazi Mahallesi, D10 KAT5 Cd, Rumeli Cd. 35-37',
        address_2: '',
        city: 'Şişli',
        state: 'İstanbul',
        postcode: '34371',
        country: 'TR',
        email: 'info@knawat.com',
        phone: '(0212) 296 11 94',
      },
      invoice_url: 'http://example.com/invoice.pdf',
      notes: 'My Orders',
      shipment_date: '2020-06-30T00:00:00.000Z',
      total: 11,
      discount: 1.3,
    },
  },
};

const OrderList  = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
      },
      externalId: {
        type: 'string',
      },
      status: {
        type: 'string',
      },
      createDate: {
        type: 'string',
        format: 'date',
      },
      updateDate: {
        type: 'string',
        format: 'date',
      },
      total: {
        type: 'number',
      },
      trackingNumber: {
        type: 'string',
      },
      knawat_order_status: {
        type: 'string',
      },
      shipment_date: {
        type: 'string',
      },
      orderNumber: {
        type: 'string',
      },
      invoice_url: {
        type: 'string',
      },
      warningsSnippet: {
        type: 'string',
        readOnly: true,
        required: false,
      },
    },
  },
};

const OrdersCreateOpenapi = {
  $path: 'post /orders',
  summary: 'Create order',
  tags: ['Orders'],
  responses: {
    200: {
      description: 'Success',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/OrderResponse',
          },
        },
      },
    },
    401: {
      $ref: '#/components/responses/UnauthorizedErrorToken',
    },
    404: {
      description: 'Status 404',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Error',
          },
          examples: {
            response: {
              value: {
                errorCode: 404,
                errorMessage: 'SKU(s) out of stock.',
                data: {
                  outOfStock: ['sku1', 'sku2'],
                },
              },
            },
          },
        },
      },
    },
    428: {
      description: 'Status 428',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            description:
              '```\n{\n              errors: [\n                {\n                  status: \'fail\',\n                  message: \'No Billing Address Or Address Missing Data. Your order failed!\',\n                  solution: `Please fill on your store billing address from here: https://app.knawat.com/settings/store`\n                }\n              ]\n            }\n```',
            properties: {
              errors: {
                type: 'array',
                items: {
                  required: ['message', 'solution', 'status'],
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['fail'],
                    },
                    message: {
                      type: 'string',
                    },
                    solution: {
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
                    status: {
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
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['order'],
          properties: {
            order: {
              $ref: '#/components/schemas/Order',
            },
          },
        },
      },
    },
    required: true,
  },
};

const OrdersUpdateOpenapi = {
  $path: 'put /orders/{order_id}',
  parameters: [
    {
      name: 'order_id',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
      },
    },
  ],
  summary: 'Update order',
  tags: ['Orders'],
  description: 'Update order by id',
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/OrderResponse',
          },
        },
      },
    },
    401: {
      $ref: '#/components/responses/UnauthorizedErrorToken',
    },
    404: {
      description: 'Status 404',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Error',
          },
          examples: {
            response: {
              value: {
                errorCode: 404,
                errorMessage: 'Order not found.',
                data: {},
              },
            },
          },
        },
      },
    },
    500: {
      description: 'Status 500',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              errors: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                  },
                  status: {
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
  security: [
    {
      bearerAuth: [] as [],
    },
  ],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['id', 'order'],
          properties: {
            id: {
              type: 'string',
            },
            order: {
              $ref: '#/components/schemas/Order',
            },
          },
          description: 'Order Confirmation',
        },
      },
    },
    required: true,
  },
};

const OrdersGetOpenapi = {
  $path: 'get /orders/{order_id}',
  summary: 'Order by id',
  tags: ['Orders'],
  parameters: [
    {
      name: 'order_id',
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
            type: 'object',
            properties: {
              order: {
                $ref: '#/components/schemas/Order',
              },
            },
          },
        },
      },
    },
    400: {
      description: 'Status 400',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'There is an error',
              },
            },
          },
        },
      },
    },
    401: {
      $ref: '#/components/responses/UnauthorizedErrorToken',
    },
    404: {
      description: 'Status 404',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Error',
          },
          examples: {
            response: {
              value: {
                errorMessage: 'Order not found.',
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

const OrdersListOpenapi = {
  $path: 'get /orders',
  summary: 'Get Order(s)',
  tags: ['Orders'],
  description: 'To get all the order info you could use get order by id end-point',
  parameters: [
    {
      name: 'limit',
      in: 'query',
      required: false,
      description: 'Size of the page to retrieve.',
      schema: {
        type: 'number',
        minimum: 1,
        maximum: 50,
        default: 10,
      },
    },
    {
      name: 'page',
      in: 'query',
      required: false,
      schema: {
        type: 'number',
        minimum: 1,
        default: 1,
      },
    },
    {
      name: 'sort',
      in: 'query',
      required: false,
      schema: {
        type: 'string',
        default: 'created_time',
        enum: [
          'created_time',
          'customer_name',
          'salesorder_number',
          'shipment_date',
          'total',
          'date',
        ],
      },
    },
    {
      name: 'sortOrder',
      in: 'query',
      required: false,
      schema: {
        type: 'string',
        default: 'D',
        enum: ['A', 'D'],
      },
    },
    {
      name: 'status',
      in: 'query',
      required: false,
      schema: {
        type: 'string',
        enum: ['draft', 'open', 'invoiced', 'partially_invoiced', 'void', 'overdue'],
      },
    },
    {
      name: 'externalId',
      in: 'query',
      required: false,
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
            $ref: '#/components/schemas/OrderList',
          },
        },
      },
    },
    401: {
      $ref: '#/components/responses/UnauthorizedErrorToken',
    },
  },
  security: [
    {
      bearerAuth: [] as [],
    },
  ],
};

const OrdersDeleteOpenapi = {
  $path: 'delete /orders/{order_id}',
  parameters: [
    {
      name: 'order_id',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
      },
    },
  ],
  summary: 'Cancel order',
  tags: ['Orders'],
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/OrderResponse',
          },
        },
      },
    },
    401: {
      $ref: '#/components/responses/UnauthorizedErrorToken',
    },
    404: {
      description: 'Status 404',
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
                    status: {
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

const OrdersPayOpenapi = {
  $path: 'put /orders/pay/{order_id}',
  summary: 'Pay order by id',
  tags: ['Orders'],
  parameters: [
    {
      name: 'order_id',
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
            type: 'object',
            properties: {
              invoicePayments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    invoicePaymentId: { type: 'string' },
                    paymentId: { type: 'string' },
                    invoiceId: { type: 'string' },
                    amountUsed: { type: 'number' },
                  },
                },
              },
              code: { type: 'number' },
              message: { type: 'string' },
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
      bearerAuth: [] as [],
    },
  ],
};

export const OrdersOpenapi: ServiceSchema = {
  name: 'orders',
  settings: {
    openapi: {
      components: {
        schemas: {
          Order,
          OrderList,
          OrderResponse,
        },
      },
    },
  },
  actions: {
    createOrder: {
      openapi: OrdersCreateOpenapi,
    },
    updateOrder: {
      openapi: OrdersUpdateOpenapi,
    },
    getOrder: {
      openapi: OrdersGetOpenapi,
    },
    list: {
      openapi: OrdersListOpenapi,
    },
    deleteOrder: {
      openapi: OrdersDeleteOpenapi,
    },
    payOrder: {
      openapi: OrdersPayOpenapi,
    },
  },
};
