import { ServiceSchema } from 'moleculer';

export const InvoicesValidation: ServiceSchema = {
  name: 'invoices',
  actions: {
    get: {
      params: {
        page: {
          type: 'number',
          integer: true,
          optional: true,
          convert: true,
        },
        limit: {
          type: 'number',
          integer: true,
          optional: true,
          convert: true,
        },
        reference_number: {
          type: 'string',
          optional: true,
        },
        invoice_number: {
          type: 'string',
          optional: true,
        },
      },
    },
    create: {
      params: {
        storeId: {
          type: 'string',
        },
        discount: {
          type: 'object',
          props: {
            value: {
              type: 'number',
              positive: true,
            },
            type: {
              type: 'enum',
              values: ['entity_level'],
            },
          },
          optional: true,
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              sku: {
                type: 'string',
              },
              barcode: {
                type: 'string',
                optional: true,
              },
              name: {
                type: 'string',
              },
              description: {
                type: 'string',
                optional: true,
              },
              url: {
                type: 'string',
                optional: true,
              },
              image: {
                type: 'string',
                optional: true,
              },
              weight: {
                type: 'number',
                optional: true,
              },
              rate: {
                type: 'number',
              },
              quantity: {
                type: 'number',
              },
              accountId: {
                type: 'string',
                optional: true,
              },
              purchaseRate: {
                type: 'number',
                optional: true,
              },
              vendorId: {
                type: 'number',
                optional: true,
              },
              taxId: [
                {
                  type: 'number',
                  optional: true,
                },
                {
                  type: 'string',
                  optional: true,
                },
              ],
              $$strict: true,
            },
          },
        },
        isInclusiveTax: {
          type: 'boolean',
          optional: true,
        },
        coupon: {
          type: 'string',
          optional: true,
        },
        dueDate: {
          type: 'string',
          pattern: /^(20[1-9][0-9])-((0[1-9])|(1(0|1|2)))-(((0[1-9])|(1|2)[0-9])|3(0|1))$/,
          optional: true,
        },
        $$strict: true,
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
    applyCredits: {
      params: {
        id: {
          type: 'string',
        },
        useSavedPaymentMethods: {
          type: 'boolean',
          optional: true,
        },
        paymentAmount: {
          type: 'number',
          optional: true,
        },
      },
    },
    createOrderInvoice: {
      params: {
        storeId: {
          type: 'string',
        },
        orderId: {
          type: 'string',
        },
      },
    },
    markInvoiceSent: {
      params: {
        omsId: {
          type: 'string',
        },
        invoiceId: {
          type: 'string',
        },
      },
    },
  },
};
