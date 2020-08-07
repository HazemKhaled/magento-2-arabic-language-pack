import { ServiceSchema } from 'moleculer';

const Order = {
  type: 'object',
  required: ['items', 'orderNumber', 'shipping', 'status'],
  properties: {
    id: {
      type: 'string',
      readOnly: true,
      description:'Knawat Order ID',
    },
    status: {
      type: 'string',
      readOnly: true,
      deprecated: true,
      description: 'Deprecated and will be removed in 2021 Q2, use financialStatus & fulfillmentStatus',
      enum: ['pending', 'processing', 'cancelled'],
    },
    items: {
      type: 'array',
      items: {
        required: ['quantity', 'sku'],
        type: 'object',
        properties: {
          id: {
            type: 'string',
            readOnly: true,
          },
          sku: {type: 'string'},
          name: {
            type: 'string',
            readOnly: true,
          },
          description: {
            type: 'string',
            readOnly: true,
          },
          rate: {
            type: 'number',
            description: 'Item price',
            readOnly: true,
          },
          quantity: {
            type: 'number',
            minimum: 1,
            maximum: 10,
          },
          discount: {
            type: 'number',
            readOnly: true,
          },
          total: {
            type: 'number',
            description: 'rate * quantity',
            readOnly: true,
          },
          taxId: {
            type: 'string',
            readOnly: true,
          },
          taxName: {
            type: 'string',
            readOnly: true,
          },
          taxType: {
            type: 'string',
            readOnly: true,
          },
          taxPercentage: {
            type: 'number',
            readOnly: true,
          },
        },
      },
      minItems: 1,
    },
    shipping: {
      required: ['address_1', 'city', 'country', 'first_name', 'last_name', 'state'],
      type: 'object',
      properties: {
        first_name: {type: 'string'},
        last_name: {type: 'string'},
        company: {type: 'string'},
        address_1: {type: 'string'},
        address_2: {type: 'string'},
        city: {type: 'string'},
        state: {type: 'string'},
        postcode: {type: 'string'},
        country: {
          type: 'string',
          description: 'ISO 3166-1 alpha-2 codes are two-letter country codes',
          minLength: 2,
          maxLength: 2,
          example: 'TR',
        },
        email: {
          type: 'string',
          format: 'email',
        },
        phone: {
          type: 'string',
          format: 'phone',
        },
      },
    },
    total: {
      type: 'number',
      readOnly: true,
    },
    discount: {
      type: 'number',
      readOnly: true,
    },
    externalId: {
      type: 'string',
      description:'Order ID in your store',
    },
    createDate: {
      type: 'string',
      format: 'date-time',
      readOnly: true,
    },
    updateDate: {
      type: 'string',
      format: 'date-time',
      readOnly: true,
    },
    knawat_order_status: {
      type: 'string',
      deprecated: true,
      description: 'Deprecated and will be removed in 2021 Q2, use financialStatus & fulfillmentStatus',
    },
    notes: {
      type: 'string',
      description: 'Extra guide for the customer or store owner for Knawat warehouse team',
    },
    adjustment: {
      type: 'number',
      description: 'Prices adjustment, could be positive or negative',
      readOnly: true,
    },
    adjustmentDescription: {
      type: 'string',
      description: 'Why we made this adjustment',
      readOnly: true,
    },
    orderNumber: {
      type: 'string',
      description: 'Knawat readable order number',
      example: 'SO-000123',
      readOnly: true,
    },
    taxTotal: {
      type: 'number',
      readOnly: true,
    },
    invoice_url: {
      type: 'string',
      description: 'Optional invoice to print with the order',
    },
    shipping_method: {type: 'string'},
    shipment_date: {
      type: 'string',
      description: 'Expected shipping date, could be updated depend on payment date, suppliers status or high demand time.',
      readOnly: true,
    },
    trackingNumber: {
      type: 'string',
      readOnly: true,
    },
    coupon: {
      type: 'string',
      description: 'Do you have Knawat coupon code? accepted only before order got paid',
    },
    warnings: {
      type: 'string',
      description: 'Json stringified order warnings, including error key, optional SKU, and extra info depend on each error',
      readOnly: true,
    },
    warningsSnippet: {
      type: 'string',
      description: 'Line separated warnings code',
      readOnly: true,
    },
    financialStatus: {
      type: 'string',
      enum: [
        'unpaid',
        'paid',
        'partially_paid',
        'voided',
        'wallet_refunded',
        'wallet_partially_refunded',
        'refunded',
        'partially_refunded',
      ],
      description: '',
      readOnly: true,
    },
    fulfillmentStatus: {
      type: 'string',
      enum: [
        'pending',
        'processing',
        'packed',
        'shipped',
        'delivered',
        'voided',
      ],
      readOnly: true,
    },
  },
  example: {
    id: '1234678901234567890',
    items: [
      {
        id: '1775488000012888568',
        sku: 'ABC-123',
        name: "[ABC-123] Women's Leopard Pattern Black Modest 2 Piece Outfit Set",
        description: 'Size: 38',
        rate: 13.28,
        quantity: 1,
        discount: 0,
        total: 13.28,
        taxId: '',
        taxName: '',
        taxType: 'tax',
        taxPercentage: 0,
      },
      {
        id: '1775488000012887569',
        sku: 'CCC-123',
        name: "[CCC-123] Women's Long Light Blue Modest Denim Jacket",
        description: 'Size: 38\nColor: Light Blue',
        rate: 22.07,
        quantity: 1,
        discount: 0,
        total: 22.07,
        taxId: '',
        taxName: '',
        taxType: 'tax',
        taxPercentage: 0,
      },
    ],
    shipping: {
      first_name: 'John',
      last_name: 'Doe',
      address_1: 'John Doe 123',
      address_2: 'Main St',
      city: 'The City',
      state: 'Any town',
      postcode: 'ST3 7HS',
      country: 'US',
      email: 'email@example.com',
      phone: '+19098648831',
    },
    total: 46.35,
    discount: 0,
    externalId: '1039.1',
    createDate: '2020-08-07T00:23:55.000Z',
    updateDate: '2020-08-07T00:23:55.000Z',
    notes: 'Drop it at the door, do not knock the door',
    adjustment: 2,
    adjustmentDescription: 'Processing Fees',
    orderNumber: 'SO-123456',
    taxTotal: 0,
    financialStatus: 'paid',
    fulfillmentStatus: 'shipped',
    invoice_url: 'https://example.com/invoice.pdf',
    warningsSnippet: 'ABC-123 low_stock\nbilling_missing',
  },
};

const OrderList  = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description:
          'On POST: Order ID in your store\n'+
          'On GET: Knawat Order ID, your ID returned in externalId',
      },
      externalId: {
        type: 'string',
        description:'Order ID in your store',
      },
      status: {
        type: 'string',
        readOnly: true,
        deprecated: true,
        description: 'Deprecated and will be removed in 2021 Q2, use financialStatus & fulfillmentStatus',
        enum: ['pending', 'processing', 'cancelled'],
      },
      createDate: {
        type: 'string',
        format: 'date-time',
        readOnly: true,
      },
      updateDate: {
        type: 'string',
        format: 'date-time',
        readOnly: true,
      },
      total: {
        type: 'number',
        readOnly: true,
      },
      shipment_date: {
        type: 'string',
        description: 'Expected shipping date, could be updated depend on payment date, suppliers status or high demand time.',
        readOnly: true,
      },
      knawat_order_status: {
        type: 'string',
        deprecated: true,
        description: 'Deprecated and will be removed in 2021 Q2, use financialStatus & fulfillmentStatus',
      },
      orderNumber: {
        type: 'string',
        description: 'Knawat readable order number',
        example: 'SO-000123',
        readOnly: true,
      },
      invoice_url: {
        type: 'string',
        description: 'Optional invoice to print with the order',
      },
      financialStatus: {
        type: 'string',
        enum: [
          'unpaid',
          'paid',
          'partially_paid',
          'voided',
          'wallet_refunded',
          'wallet_partially_refunded',
          'refunded',
          'partially_refunded',
        ],
        description: '',
        readOnly: true,
      },
      fulfillmentStatus: {
        type: 'string',
        enum: [
          'pending',
          'processing',
          'packed',
          'shipped',
          'delivered',
          'voided',
        ],
        readOnly: true,
      },
      trackingNumber: {
        type: 'string',
        readOnly: true,
      },
      warningsSnippet: {
        type: 'string',
        description: 'Line separated warnings code',
        readOnly: true,
      },
    },
  },
};

const OrdersCreateOpenapi = {
  $path: 'post /orders',
  summary: 'Create order',
  tags: ['Orders'],
  requestBody: {$ref: '#/components/requestBodies/Order'},
  responses: {
    200: {$ref: '#/components/responses/Order'},
    401: {$ref: '#/components/responses/UnauthorizedErrorToken'},
    404: {
      description: 'SKU(s) out of stock',
      content: {
        'application/json': {
          schema: {$ref: '#/components/schemas/Error'},
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
    500: {$ref: '#/components/responses/500'},
  },
  security: [{bearerAuth: [] as []}],
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
  requestBody: {$ref: '#/components/requestBodies/Order'},
  responses: {
    200: {$ref: '#/components/responses/Order'},
    401: {$ref: '#/components/responses/UnauthorizedErrorToken'},
    404: {$ref: '#/components/responses/404'},
    500: {$ref: '#/components/responses/500'},
  },
  security: [{bearerAuth: [] as []}],
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
    200: {$ref: '#/components/responses/Order'},
    401: {$ref: '#/components/responses/UnauthorizedErrorToken'},
    404: {$ref: '#/components/responses/404'},
  },
  security: [{bearerAuth: [] as []}],
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
    200: {$ref: '#/components/responses/OrderList'},
    401: {$ref: '#/components/responses/UnauthorizedErrorToken'},
  },
  security: [{bearerAuth: [] as []}],
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
    200: {$ref: '#/components/responses/Order'},
    401: {$ref: '#/components/responses/UnauthorizedErrorToken'},
    404: {$ref: '#/components/responses/404'},
    500: {$ref: '#/components/responses/500'},
  },
  security: [{bearerAuth: [] as []}],
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
    401: {$ref: '#/components/responses/UnauthorizedErrorBasic'},
    404: {$ref: '#/components/responses/404'},
    500: {$ref: '#/components/responses/500'},
  },
  security: [{bearerAuth: [] as []}],
};

export const OrdersOpenapi: ServiceSchema = {
  name: 'orders',
  settings: {
    openapi: {
      components: {
        schemas: {
          Order,
        },
        responses: {
          Order: {
            description: 'Status 200',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Order',
                },
              },
            },
          },
          OrderList: {
            description: 'Status 200',
            content: {
              'application/json': {
                schema: OrderList,
              },
            },
          },
        },
        requestBodies: {
          Order: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Order' },
              },
            },
          },
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
