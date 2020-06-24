import { ServiceSchema } from 'moleculer';

export const OrdersValidation: ServiceSchema = {
  name: 'orders',
  actions: {
    createOrder: {
      params: {
        id: [
          {
            type: 'string',
            empty: false,
            optional: true,
          },
          {
            type: 'number',
            integer: true,
            convert: true,
            optional: true,
          },
        ],
        status: {
          type: 'enum',
          values: [
            'pending',
            'processing',
            'cancelled',
          ],
        },
        items: {
          type: 'array',
          items: 'object',
          min: 1,
          props: {
            quantity: {
              type: 'number',
              min: 1,
              max: 10,
            },
            sku: {
              type: 'string',
              empty: false,
            },
          },
        },
        shipping: {
          type: 'object',
          props: {
            first_name: {
              type: 'string',
              empty: false,
            },
            last_name: {
              type: 'string',
              empty: false,
            },
            company: [{
              type: 'string',
              optional: true,
            },
            {
              type: 'custom',
              optional: true,
            },
            ],
            address_1: {
              type: 'string',
              empty: false,
            },
            address_2: {
              type: 'string',
              optional: true,
            },
            city: {
              type: 'string',
              empty: false,
            },
            state: {
              type: 'string',
              optional: true,
            },
            postcode: {
              type: 'string',
              optional: true,
            },
            country: {
              type: 'string',
              length: 2,
            },
            phone: {
              type: 'string',
              optional: true,
            },
            email: {
              type: 'email',
              optional: true,
            },
          },
        },
        invoice_url: {
          type: 'string',
          optional: true,
        },
        notes: {
          type: 'string',
          optional: true,
        },
        shipping_method: {
          type: 'string',
          optional: true,
        },
        coupon: {
          type: 'string',
          optional: true,
        },
      },
    },
    updateOrder: {
      params: {
        id: [{
          type: 'string',
          empty: false,
        },
        {
          type: 'number',
          integer: true,
          convert: true,
        },
        ],
        status: {
          type: 'enum',
          values: [
            'pending',
            'processing',
            'cancelled',
          ],
          optional: true,
        },
        items: {
          type: 'array',
          optional: true,
          items: 'object',
          min: 1,
          props: {
            quantity: {
              type: 'number',
              min: 1,
              max: 10,
            },
            sku: {
              type: 'string',
              empty: false,
            },
          },
        },
        shipping: {
          type: 'object',
          optional: true,
          props: {
            first_name: {
              type: 'string',
              empty: false,
            },
            last_name: {
              type: 'string',
              empty: false,
            },
            company: {
              type: 'string',
              optional: true,
            },
            address_1: {
              type: 'string',
              empty: false,
            },
            address_2: {
              type: 'string',
              optional: true,
            },
            city: {
              type: 'string',
              empty: false,
            },
            state: {
              type: 'string',
              optional: true,
            },
            postcode: {
              type: 'string',
              optional: true,
            },
            country: {
              type: 'string',
              length: 2,
            },
            phone: {
              type: 'string',
              optional: true,
            },
            email: {
              type: 'email',
              optional: true,
            },
          },
        },
        invoice_url: {
          type: 'string',
          optional: true,
        },
        notes: {
          type: 'string',
          optional: true,
        },
        shipping_method: {
          type: 'string',
          optional: true,
        },
      },
    },
    getOrder: {
      params: {
        order_id: {
          type: 'string',
        },
      },
    },
    list: {
      params: {
        limit: {
          type: 'number',
          convert: true,
          integer: true,
          min: 1,
          max: 50,
          optional: true,
        },
        page: {
          type: 'number',
          convert: true,
          integer: true,
          min: 1,
          optional: true,
        },
        sort: {
          type: 'enum',
          values: [
            'created_time',
            'customer_name',
            'salesorder_number',
            'shipment_date',
            'total',
            'date',
          ],
          optional: true,
        },
        sortOrder: {
          type: 'enum',
          values: [
            'A',
            'D',
          ],
          optional: true,
        },
        status: {
          type: 'enum',
          values: [
            'draft',
            'open',
            'invoiced',
            'partially_invoiced',
            'void',
            'overdue',
          ],
          optional: true,
        },
        externalId: {
          type: 'string',
          optional: true,
        },
        date: {
          type: 'date',
          convert: true,
          optional: true,
        },
        dateStart: {
          type: 'date',
          convert: true,
          optional: true,
        },
        dateEnd: {
          type: 'date',
          convert: true,
          optional: true,
        },
        dateAfter: {
          type: 'date',
          convert: true,
          optional: true,
        },
        shipmentDate: {
          type: 'date',
          convert: true,
          optional: true,
        },
        shipmentDateStart: {
          type: 'date',
          convert: true,
          optional: true,
        },
        shipmentDateEnd: {
          type: 'date',
          convert: true,
          optional: true,
        },
        shipmentDateBefore: {
          type: 'date',
          convert: true,
          optional: true,
        },
        shipmentDateAfter: {
          type: 'date',
          convert: true,
          optional: true,
        },
        timestamp: {
          type: 'string',
          optional: true,
        },
      },
    },
    deleteOrder: {
      params: {
        id: {
          type: 'string',
          convert: true,
        },
      },
    },
  },
};
