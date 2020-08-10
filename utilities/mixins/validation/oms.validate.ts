import { ServiceSchema } from 'moleculer';

export const OmsValidation: ServiceSchema = {
  name: 'oms',
  actions: {
    listInvoice: {
      params: {
        omsId: { type: 'string' },
        page: { type: 'number', integer: true, optional: true, convert: true },
        limit: { type: 'number', integer: true, optional: true, convert: true },
        reference_number: { type: 'string', optional: true },
        invoice_number: { type: 'string', optional: true },
      },
    },
    createInvoice: {
      params: {
        customerId: { type: 'string' },
        discount: { type: 'number', positive: true, optional: true },
        discountType: {
          type: 'enum',
          values: ['entity_level'],
          optional: true,
        },
        coupon: { type: 'string', optional: true },
        items: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              sku: { type: 'string' },
              barcode: { type: 'string', optional: true },
              name: { type: 'string' },
              description: { type: 'string', optional: true },
              url: { type: 'string', optional: true },
              image: { type: 'string', optional: true },
              weight: { type: 'number', optional: true },
              rate: { type: 'number' },
              quantity: { type: 'number' },
              accountId: { type: 'string', optional: true },
              purchaseRate: { type: 'number', optional: true },
              vendorId: { type: 'number', optional: true },
              taxId: { type: 'string', optional: true },
              $$strict: true,
            },
          },
        },
        isInclusiveTax: {
          type: 'boolean',
          optional: true,
        },
      },
    },
    updateInvoiceStatus: {
      params: {
        omsId: 'string',
        invoiceId: 'string',
        status: 'string',
        $$strict: true,
      },
    },
    applyInvoiceCredits: {
      params: { customerId: { type: 'string' }, invoiceId: { type: 'string' } },
    },
    createSalesOrderInvoice: {
      params: { customerId: { type: 'string' }, orderId: { type: 'string' } },
    },
    markInvoiceToSent: {
      params: { customerId: { type: 'string' }, invoiceId: { type: 'string' } },
    },
    createNewOrder: {
      params: {
        store: {
          type: 'object',
          props: {
            id: { type: 'string', optional: true },
            name: { type: 'string', optional: true },
            url: { type: 'string', optional: true },
            users: {
              type: 'array',
              items: {
                type: 'object',
                props: {
                  email: 'string',
                  first_name: { type: 'string', optional: true },
                  last_name: { type: 'string', optional: true },
                },
              },
              optional: true,
            },
          },
        },
        externalId: 'string',
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
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              sku: 'string',
              barcode: { type: 'string', optional: true },
              name: 'string',
              description: { type: 'string', optional: true },
              url: { type: 'url', optional: true },
              image: { type: 'url', optional: true },
              weight: { type: 'number', optional: true },
              rate: 'number',
              quantity: 'number',
              productType: { type: 'string', optional: true },
              purchaseRate: { type: 'number', optional: true },
              vendorId: [
                { type: 'string', optional: true },
                { type: 'number', optional: true },
              ],
              accountId: { type: 'string', optional: true },
            },
          },
        },
        shipping: {
          type: 'object',
          props: {
            first_name: 'string',
            last_name: 'string',
            company: { type: 'string', optional: true },
            address_1: 'string',
            address_2: { type: 'string', optional: true },
            city: { type: 'string', optional: true },
            state: { type: 'string', optional: true },
            postcode: { type: 'string', optional: true },
            country: 'string',
            email: { type: 'string', optional: true },
            phone: { type: 'string', optional: true },
          },
        },
        externalInvoice: 'string',
        shipmentCourier: 'string',
        shippingCharge: 'number',
        discount: { type: 'string', optional: true },
        adjustment: { type: 'number', optional: true },
        adjustmentDescription: { type: 'string', optional: true },
        subscription: { type: 'string', optional: true },
        notes: { type: 'string', optional: true },
        orderNumber: { type: 'string', optional: true },
      },
    },
    updateOrderById: {
      params: {
        customerId: 'string',
        orderId: 'string',
        externalId: { type: 'string', optional: true },
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
        items: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              sku: 'string',
              barcode: { type: 'string', optional: true },
              name: 'string',
              description: { type: 'string', optional: true },
              url: { type: 'url', optional: true },
              image: { type: 'url', optional: true },
              weight: { type: 'number', optional: true },
              rate: 'number',
              quantity: 'number',
              productType: { type: 'string', optional: true },
              purchaseRate: { type: 'number', optional: true },
              vendorId: [
                { type: 'string', optional: true },
                { type: 'number', optional: true },
              ],
              accountId: { type: 'string', optional: true },
            },
          },
        },
        shipping: {
          type: 'object',
          props: {
            first_name: 'string',
            last_name: 'string',
            company: { type: 'string', optional: true },
            address_1: 'string',
            address_2: { type: 'string', optional: true },
            city: { type: 'string', optional: true },
            state: { type: 'string', optional: true },
            postcode: { type: 'string', optional: true },
            country: 'string',
            email: { type: 'string', optional: true },
            phone: { type: 'string', optional: true },
          },
          optional: true,
        },
        externalInvoice: { type: 'string', optional: true },
        shipmentCourier: { type: 'string', optional: true },
        shippingCharge: { type: 'number', optional: true },
        discount: { type: 'string', optional: true },
        adjustment: { type: 'number', optional: true },
        adjustmentDescription: { type: 'string', optional: true },
        subscription: { type: 'string', optional: true },
        notes: { type: 'string', optional: true },
        orderNumber: { type: 'string', optional: true },
      },
    },
    getOrderById: { params: { customerId: 'string', orderId: 'string' } },
    listOrders: {
      params: {
        customerId: 'string',
        page: { type: 'number', convert: true, optional: true },
        perPage: { type: 'number', convert: true, optional: true },
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
        externalId: { type: 'string', optional: true },
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
      },
    },
    deleteOrderById: { params: { customerId: 'string', orderId: 'string' } },
    createPayment: {
      params: {
        customerId: 'string',
        paymentMode: 'string',
        amount: 'number',
        invoices: {
          type: 'array',
          item: {
            type: 'object',
            props: {
              amount_applied: {
                type: 'number',
                convert: true,
              },
              invoice_id: {
                type: 'string',
              },
            },
          },
          optional: true,
        },
        bankCharges: {
          type: 'number',
          optional: true,
          convert: true,
        },
        accountId: 'string',
        referenceNumber: [
          {
            type: 'string',
            optional: true,
          },
          {
            type: 'number',
            integer: true,
            optional: true,
          },
        ],
        description: {
          type: 'string',
          optional: true,
        },
      },
    },
    listPayments: {
      params: {
        customerId: 'string',
        page: { type: 'number', convert: true, optional: true },
        perPage: { type: 'number', convert: true, optional: true },
        referenceNumber: { type: 'string', optional: true },
        paymentMode: { type: 'string', optional: true },
      },
    },
    getCustomer: { params: { customerId: 'string' } },
    getCustomerByUrl: { params: { storeId: 'string' } },
    createCustomer: {
      params: {
        url: 'string',
        name: 'string',
        users: { type: 'array', items: { type: 'object' } },
        companyName: { type: 'string', optional: true },
        status: { type: 'string', optional: true },
        platform: { type: 'string', optional: true },
        stockDate: { type: 'date', convert: true, optional: true },
        stockStatus: { type: 'string', optional: true },
        priceDate: { type: 'date', convert: true, optional: true },
        priceStatus: { type: 'string', optional: true },
        salePrice: { type: 'number', optional: true },
        saleOperator: { type: 'number', optional: true },
        comparedPrice: { type: 'number', optional: true },
        comparedOperator: { type: 'number', optional: true },
        currency: { type: 'string', optional: true },
        languages: { type: 'array', items: { type: 'string' }, optional: true },
        shippingMethods: {
          type: 'array',
          items: { type: 'string' },
          optional: true,
        },
        billing: {
          type: 'object',
          props: {
            first_name: 'string',
            last_name: 'string',
            company: { type: 'string', optional: true },
            address_1: 'string',
            address_2: { type: 'string', optional: true },
            city: { type: 'string', optional: true },
            state: { type: 'string', optional: true },
            postcode: { type: 'string', optional: true },
            country: 'string',
            email: { type: 'string', optional: true },
            phone: { type: 'string', optional: true },
          },
          optional: true,
        },
      },
    },
    createTax: {
      params: {
        name: { type: 'string' },
        percentage: { type: 'number' },
        type: { type: 'enum', values: ['tax', 'compound_tax'] },
        $$strict: true,
      },
    },
    updateTax: {
      params: {
        id: 'string',
        name: { type: 'string', optional: true },
        percentage: { type: 'number', optional: true },
        type: { type: 'enum', values: ['tax', 'compound_tax'], optional: true },
        $$strict: true,
      },
    },
    deleteTax: {
      params: {
        id: 'string',
        $$strict: true,
      },
    },
  },
};
