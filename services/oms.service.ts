import { Context, Errors, ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';
import { OmsValidation } from '../utilities/mixins/validation';
const MoleculerError = Errors.MoleculerError;

const TheService: ServiceSchema = {
  name: 'oms',
  mixins: [OmsValidation],
  settings: {
    auth: Buffer.from(`${process.env.BASIC_USER}:${process.env.BASIC_PASS}`).toString('base64'),
    url: `${process.env.OMS_BASEURL}`,
  },
  actions: {
    // Invoices
    listInvoice: {
      handler(ctx: Context) {
        const params = { ...ctx.params };
        delete params.omsId;
        return this.request({
          path: `invoices/${ctx.params.omsId}`,
          params,
        });
      },
    },
    createInvoice: {
      handler(ctx: Context) {
        return this.request({
          path: 'invoices',
          method: 'post',
          body: ctx.params,
        });
      },
    },
    applyInvoiceCredits: {
      handler(ctx: Context) {
        return this.request({
          path: `invoices/${ctx.params.customerId}/${ctx.params.invoiceId}/credits`,
          method: 'post',
        });
      },
    },
    createSalesOrderInvoice: {
      handler(ctx: Context) {
        return this.request({
          path: `invoices/${ctx.params.customerId}/${ctx.params.orderId}`,
          method: 'post',
        });
      },
    },
    markInvoiceToSent: {
      handler(ctx: Context) {
        return this.request({
          path: `invoices/${ctx.params.customerId}/${ctx.params.invoiceId}/sent`,
          method: 'post',
        });
      },
    },

    // Orders
    createNewOrder: {
      handler(ctx: Context) {
        return this.request({
          path: 'orders',
          method: 'post',
          body: ctx.params,
        });
      },
    },
    updateOrderById: {
      handler(ctx: Context) {
        const body: {} = { ...ctx.params, customerId: undefined, orderId: undefined };
        return this.request({
          path: `orders/${ctx.params.customerId}/${ctx.params.orderId}`,
          method: 'put',
          body,
        });
      },
    },
    getOrderById: {
      handler(ctx: Context) {
        return this.request({
          path: `orders/${ctx.params.customerId}/${ctx.params.orderId}`,
        });
      },
    },
    listOrders: {
      handler(ctx: Context) {
        const params: {[key: string]: string} = { ...ctx.params };
        delete params.customerId;
        return this.request({
          path: `orders/${ctx.params.customerId}`,
          params,
        });
      },
    },
    deleteOrderById: {
      handler(ctx: Context) {
        return this.request({
          path: `orders/${ctx.params.customerId}/${ctx.params.orderId}`,
          method: 'delete',
        });
      },
    },

    // Payments
    createPayment: {
      handler(ctx: Context) {
        const body: {} = { ...ctx.params, customerId: undefined };
        return this.request({
          path: `payments/${ctx.params.customerId}`,
          method: 'post',
          body,
        });
      },
    },
    listPayments: {
      handler(ctx: Context) {
        const params: {[key: string]: string} = { ...ctx.params};
        delete params.customerId;
        return this.request({
          path: `payments/${ctx.params.customerId}`,
          params,
        });
      },
    },

    // Stores
    getCustomer: {
      handler(ctx: Context) {
        return this.request({
          path: `stores/${ctx.params.customerId}`,
        });
      },
    },
    getCustomerByUrl: {
      handler(ctx: Context) {
        return this.request({
          path: `stores?url=${encodeURIComponent(ctx.params.storeId)}`,
        });
      },
    },
    createCustomer: {
      handler(ctx: Context) {
        return this.request({
          path: 'stores',
          method: 'post',
          body: ctx.params,
        });
      },
    },
  },
  methods: {
    request({
      path,
      method = 'get',
      body,
      params,
    }: {
      path: string;
      method: string;
      body: { [key: string]: unknown };
      params: { [key: string]: string };
    }) {
      let queryString = '';
      if (params) {
        queryString = Object.keys(params).reduce(
          (accumulator, key) => `${accumulator}${accumulator ? '&' : '?'}${key}=${params[key]}`,
          '',
        );
      }
      return fetch(`${this.settings.url}/${path}${queryString}`, {
        method,
        body: JSON.stringify(body),
        headers: {
          Authorization: `Basic ${this.settings.auth}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
        .then(async res => {
          const parsedRes = await res.json();
          if (!res.ok) {
            throw new MoleculerError(
              parsedRes && parsedRes.error && parsedRes.error.message,
              res.status,
            );
          }
          return parsedRes;
        })
        .catch(err => {
          throw new MoleculerError(err.message, err.code);
        });
    },
  },
};

export = TheService;