import { Context, Errors, ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';
const MoleculerError = Errors.MoleculerError;

const TheService: ServiceSchema = {
  name: 'oms',
  settings: {
    auth: Buffer.from(`${process.env.BASIC_USER}:${process.env.BASIC_PASS}`).toString('base64'),
    url: `${process.env.OMS_BASEURL}`
  },
  actions: {
    // Invoices
    listInvoice: {
      params: {
        omsId: { type: 'string' },
        page: { type: 'number', integer: true, optional: true, convert: true },
        limit: { type: 'number', integer: true, optional: true, convert: true },
        reference_number: { type: 'string', optional: true },
        invoice_number: { type: 'string', optional: true }
      },
      handler(ctx: Context) {
        const params = { ...ctx.params };
        delete params.omsId;
        return this.request({
          path: `invoices/${ctx.params.omsId}`,
          params,
        });
      }
    },
    createInvoice: {
      params: {
        customerId: { type: 'string' },
        discount: { type: 'number', positive: true, optional: true },
        discountType: { type: 'enum', values: ['entity_level'], optional: true },
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
              $$strict: true
            }
          }
        }
      },
      handler(ctx: Context) {
        return this.request({
          path: 'invoices',
          method: 'post',
          body: ctx.params
        });
      }
    },
    applyInvoiceCredits: {
      params: {
        customerId: { type: 'string' },
        invoiceId: { type: 'string' }
      },
      handler(ctx: Context) {
        return this.request({
          path: `invoices/${ctx.params.customerId}/${ctx.params.invoiceId}/credits`,
          method: 'post'
        });
      }
    },
    createSalesOrderInvoice: {
      params: {
        customerId: { type: 'string' },
        orderId: { type: 'string' }
      },
      handler(ctx: Context) {
        return this.request({
          path: `invoices/${ctx.params.customerId}/${ctx.params.orderId}`,
          method: 'post'
        });
      }
    },
    markInvoiceToSent: {
      params: {
        customerId: { type: 'string' },
        invoiceId: { type: 'string' }
      },
      handler(ctx: Context) {
        return this.request({
          path: `invoices/${ctx.params.customerId}/${ctx.params.invoiceId}/sent`,
          method: 'post'
        });
      }
    },

    // Orders
    createNewOrder: {
      params: {
        store: {
          type: 'object',
          props: {
            id: 'string',
            name: 'string',
            url: 'string',
            users: {
              type: 'array',
              items: {
                type: 'object',
                props: {
                  email: 'string',
                  first_name: 'string',
                  last_name: 'string'
                }
              }
            }
          }
        },
        externalId: 'string',
        status: {
          type: 'enum',
          values: ['draft', 'open', 'invoiced', 'partially_invoiced', 'void', 'overdue']
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              sku: 'string',
              barcode: {
                type: 'string',
                optional: true
              },
              name: 'string',
              description: {
                type: 'string',
                optional: true
              },
              url: {
                type: 'url',
                optional: true
              },
              image: {
                type: 'url',
                optional: true
              },
              weight: {
                type: 'number',
                optional: true
              },
              rate: 'number',
              quantity: 'number',
              productType: {
                type: 'string',
                optional: true
              },
              purchaseRate: {
                type: 'number',
                optional: true
              },
              vendorId: {
                type: 'string',
                optional: true
              },
              accountId: {
                type: 'string',
                optional: true
              }
            }
          }
        },
        shipping: {
          type: 'object',
          props: {
            first_name: 'string',
            last_name: 'string',
            company: {
              type: 'string',
              optional: true
            },
            address_1: 'string',
            address_2: {
              type: 'string',
              optional: true
            },
            city: {
              type: 'string',
              optional: true
            },
            state: {
              type: 'string',
              optional: true
            },
            postcode: {
              type: 'string',
              optional: true
            },
            country: 'string',
            email: {
              type: 'string',
              optional: true
            },
            phone: {
              type: 'string',
              optional: true
            }
          }
        },
        externalInvoice: 'string',
        shipmentCourier: 'string',
        shippingCharge: 'number',
        adjustment: {
          type: 'number',
          optional: true
        },
        adjustmentDescription: {
          type: 'string',
          optional: true
        },
        subscription: {
          type: 'string',
          optional: true
        },
        notes: {
          type: 'string',
          optional: true
        },
        orderNumber: {
          type: 'string',
          optional: true
        }
      },
      handler(ctx: Context) {
        return this.request({
          path: 'orders',
          method: 'post',
          body: ctx.params
        });
      }
    },
    updateOrderById: {
      params: {
        customerId: 'string',
        orderId: 'string',
        externalId: {
          type: 'string',
          optional: true
        },
        status: {
          type: 'enum',
          values: ['draft', 'open', 'invoiced', 'partially_invoiced', 'void', 'overdue'],
          optional: true
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              sku: 'string',
              barcode: {
                type: 'string',
                optional: true
              },
              name: 'string',
              description: {
                type: 'string',
                optional: true
              },
              url: {
                type: 'url',
                optional: true
              },
              image: {
                type: 'url',
                optional: true
              },
              weight: {
                type: 'number',
                optional: true
              },
              rate: 'number',
              quantity: 'number',
              productType: {
                type: 'string',
                optional: true
              },
              purchaseRate: {
                type: 'number',
                optional: true
              },
              vendorId: {
                type: 'string',
                optional: true
              },
              accountId: {
                type: 'string',
                optional: true
              }
            }
          }
        },
        shipping: {
          type: 'object',
          props: {
            first_name: 'string',
            last_name: 'string',
            company: {
              type: 'string',
              optional: true
            },
            address_1: 'string',
            address_2: {
              type: 'string',
              optional: true
            },
            city: {
              type: 'string',
              optional: true
            },
            state: {
              type: 'string',
              optional: true
            },
            postcode: {
              type: 'string',
              optional: true
            },
            country: 'string',
            email: {
              type: 'string',
              optional: true
            },
            phone: {
              type: 'string',
              optional: true
            }
          }
        },
        externalInvoice: {
          type: 'string',
          optional: true
        },
        shipmentCourier: {
          type: 'string',
          optional: true
        },
        shippingCharge: {
          type: 'number',
          optional: true
        },
        adjustment: {
          type: 'number',
          optional: true
        },
        adjustmentDescription: {
          type: 'string',
          optional: true
        },
        subscription: {
          type: 'string',
          optional: true
        },
        notes: {
          type: 'string',
          optional: true
        },
        orderNumber: {
          type: 'string',
          optional: true
        }
      },
      handler(ctx: Context) {
        const body: {} = { ...ctx.params, customerId: undefined, orderId: undefined };
        return this.request({
          path: `orders/${ctx.params.customerId}/${ctx.params.orderId}`,
          method: 'put',
          body
        });
      }
    },
    getOrderById: {
      params: {
        customerId: 'string',
        orderId: 'string'
      },
      handler(ctx: Context) {
        return this.request({
          path: `orders/${ctx.params.customerId}/${ctx.params.orderId}`
        });
      }
    },
    listOrders: {
      params: {
        customerId: 'string',
        page: { type: 'number', convert: true, optional: true },
        perPage: { type: 'number', convert: true, optional: true },
        status: {
          type: 'enum',
          values: ['draft', 'open', 'invoiced', 'partially_invoiced', 'void', 'overdue'],
          optional: true
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
            'date'
          ],
          optional: true
        }
      },
      handler(ctx: Context) {
        const params: {[key: string]: string} = { ...ctx.params };
        delete params.customerId;
        return this.request({
          path: `orders/${ctx.params.customerId}`,
          params
        });
      }
    },
    deleteOrderById: {
      params: {
        customerId: 'string',
        orderId: 'string'
      },
      handler(ctx: Context) {
        return this.request({
          path: `orders/${ctx.params.customerId}/${ctx.params.orderId}`,
          method: 'delete'
        });
      }
    },

    // Payments
    createPayment: {
      params: {
        customerId: 'string',
        paymentMode: 'string',
        amount: 'number',
        invoices: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              amountApplied: 'number',
              invoiceId: 'string'
            }
          }
        },
        bankCharges: 'number',
        accountId: 'string',
        referenceNumber: 'string'
      },
      handler(ctx: Context) {
        const body: {} = { ...ctx.params, customerId: undefined };
        return this.request({
          path: `payments/${ctx.params.customerId}`,
          method: 'post',
          body
        });
      }
    },
    listPayments: {
      params: {
        customerId: 'string',
        page: { type: 'number', convert: true, optional: true },
        perPage: { type: 'number', convert: true, optional: true },
        referenceNumber: { type: 'string', optional: true },
        paymentMode: { type: 'string', optional: true }
      },
      handler(ctx: Context) {
        const params: {[key: string]: string} = { ...ctx.params};
        delete params.customerId;
        return this.request({
          path: `payments/${ctx.params.customerId}`,
          params
        });
      }
    },

    // Stores
    getCustomer: {
      params: {
        customerId: 'string'
      },
      handler(ctx: Context) {
        return this.request({
          path: `stores/${ctx.params.customerId}`
        });
      }
    },
    getCustomerByUrl: {
      params: {
        storeId: 'string'
      },
      handler(ctx: Context) {
        return this.request({
          path: `stores?url=${encodeURIComponent(ctx.params.storeId)}`
        });
      }
    },
    createCustomer: {
      params: {
        url: "string",
        name: "string",
        users: {
          type: "array",
          items: {
            type: "object"
          }
        },
        companyName: { type: "string", optional: true },
        status: { type: "string", optional: true },
        platform: { type: "string", optional: true },
        stockDate: { type: "string", optional: true },
        stockStatus: { type: "string", optional: true },
        priceDate: { type: "string", optional: true },
        priceStatus: { type: "string", optional: true },
        salePrice: { type: "number", optional: true },
        saleOperator: { type: "number", optional: true },
        comparedPrice: { type: "number", optional: true },
        comparedOperator: { type: "number", optional: true },
        currency: { type: "string", optional: true },
        languages: {
          type: "array",
          items: { type: "string" },
          optional: true
        },
        shippingMethods: {
          type: "array",
          items: { type: "string" },
          optional: true
        },
        billing: {
          type: "object",
          props: {
            first_name: "string",
            last_name: "string",
            company: {
              type: "string",
              optional: true
            },
            address_1: "string",
            address_2: {
              type: "string",
              optional: true
            },
            city: {
              type: "string",
              optional: true
            },
            state: {
              type: "string",
              optional: true
            },
            postcode: {
              type: "string",
              optional: true
            },
            country: "string",
            email: {
              type: "string",
              optional: true
            },
            phone: {
              type: "string",
              optional: true
            }
          }
        }
      },
      handler(ctx: Context) {
        return this.request({
          path: 'stores',
          method: 'post',
          body: ctx.params
        });
      }
    }
  },
  methods: {
    request({
      path,
      method = 'get',
      body,
      params
    }: {
      path: string;
      method: string;
      body: { [key: string]: unknown };
      params: { [key: string]: string };
    }) {
      let queryString = '';
      if (params) {
        queryString = Object.keys(params).reduce(
          (accumulator, key) => `${accumulator ? '&' : '?'}${key}=${params[key]}`,
          ''
        );
      }
      return fetch(`${this.settings.url}/${path}${queryString}`, {
        method,
        body: JSON.stringify(body),
        headers: {
          Authorization: `Basic ${this.settings.auth}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      })
        .then(async res => {
          const parsedRes = await res.json();
          if (!res.ok) {
            throw new MoleculerError(
              parsedRes && parsedRes.error && parsedRes.error.message,
              res.status
            );
          }
          return parsedRes;
        })
        .catch(err => {
          throw new MoleculerError(err.message, err.code);
        });
    }
  }
};

export = TheService;
