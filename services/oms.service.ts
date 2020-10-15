import { Context, Errors, GenericObject, ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';

import {
  OmsRequestParams,
  CreateOrderRequestParams,
  OrderRequestParams,
  InvoiceRequestParams,
  updateOderRequestParams,
  StoreRequest,
  CreateCustomerRequest,
  TaxRequestParams,
  DynamicRequestParams,
  CommonError,
  Order,
} from '../utilities/types';
import DbService from '../utilities/mixins/mongo.mixin';
import { OmsValidation } from '../utilities/mixins/validation';

const MoleculerError = Errors.MoleculerError;

const TheService: ServiceSchema = {
  name: 'oms',
  mixins: [OmsValidation, DbService('omsRequests')],
  settings: {
    auth: Buffer.from(
      `${process.env.BASIC_USER}:${process.env.BASIC_PASS}`
    ).toString('base64'),
    url: `${process.env.OMS_BASEURL}`,
  },
  actions: {
    // Invoices
    listInvoice: {
      handler(ctx: Context<OmsRequestParams>) {
        const params = { ...ctx.params };

        if (!params.omsId) {
          return { invoices: [] };
        }

        delete params.omsId;
        return this.request({
          path: `invoices/${ctx.params.omsId}`,
          params,
        });
      },
    },
    createInvoice: {
      handler(ctx: Context<OmsRequestParams>) {
        return this.request({
          path: 'invoices',
          method: 'post',
          body: ctx.params,
        });
      },
    },
    updateInvoiceStatus: {
      handler(ctx: Context<InvoiceRequestParams>) {
        const { omsId, invoiceId, status } = ctx.params;
        return this.request({
          path: `invoices/${omsId}/${invoiceId}/status/${status}`,
          method: 'post',
        });
      },
    },
    applyInvoiceCredits: {
      handler(ctx: Context<InvoiceRequestParams>) {
        return this.request({
          path: `invoices/${ctx.params.customerId}/${ctx.params.invoiceId}/credits`,
          method: 'post',
        });
      },
    },
    createSalesOrderInvoice: {
      handler(ctx: Context<InvoiceRequestParams>) {
        return this.request({
          path: `invoices/${ctx.params.customerId}/${ctx.params.orderId}`,
          method: 'post',
        });
      },
    },
    markInvoiceToSent: {
      handler(ctx: Context<InvoiceRequestParams>) {
        return this.request({
          path: `invoices/${ctx.params.customerId}/${ctx.params.invoiceId}/sent`,
          method: 'post',
        });
      },
    },

    // Orders
    createNewOrder: {
      handler(ctx: Context<CreateOrderRequestParams>) {
        return this.request({
          path: 'orders',
          method: 'post',
          body: ctx.params,
        });
      },
    },
    updateOrderById: {
      handler(ctx: Context<updateOderRequestParams>) {
        const body: Partial<updateOderRequestParams> = {
          ...ctx.params,
          customerId: undefined,
          orderId: undefined,
        };
        return this.request({
          path: `orders/${ctx.params.customerId}/${ctx.params.orderId}`,
          method: 'put',
          body,
        });
      },
    },
    getOrderById: {
      handler(ctx: Context<OrderRequestParams>) {
        return this.request({
          path: `orders/${ctx.params.customerId}/${ctx.params.orderId}`,
        });
      },
    },
    listOrders: {
      handler(ctx: Context<DynamicRequestParams>) {
        const params: { [key: string]: string } = { ...ctx.params };
        delete params.customerId;
        return this.request({
          path: `orders/${ctx.params.customerId}`,
          params,
        });
      },
    },
    deleteOrderById: {
      handler(ctx: Context<OrderRequestParams>) {
        return this.request({
          path: `orders/${ctx.params.customerId}/${ctx.params.orderId}`,
          method: 'delete',
        });
      },
    },

    // Payments
    createPayment: {
      handler(ctx: Context<DynamicRequestParams>) {
        const body: DynamicRequestParams = {
          ...ctx.params,
          customerId: undefined,
        };
        return this.request({
          path: `payments/${ctx.params.customerId}`,
          method: 'post',
          body,
        });
      },
    },
    listPayments: {
      handler(ctx: Context<DynamicRequestParams>) {
        const params: { [key: string]: string } = { ...ctx.params };
        delete params.customerId;
        return this.request({
          path: `payments/${ctx.params.customerId}`,
          params,
        });
      },
    },

    // Stores
    getCustomer: {
      handler(ctx: Context<StoreRequest>) {
        return this.request({
          path: `stores/${ctx.params.customerId}`,
        });
      },
    },
    getCustomerByUrl: {
      handler(ctx: Context<StoreRequest>) {
        return this.request({
          path: `stores?url=${encodeURIComponent(ctx.params.storeId)}`,
        });
      },
    },
    createCustomer: {
      handler(ctx: Context<CreateCustomerRequest>) {
        return this.request({
          path: 'stores',
          method: 'post',
          body: ctx.params,
        });
      },
    },
    // Taxes
    createTax: {
      handler(ctx: Context<TaxRequestParams>) {
        return this.request({
          path: 'tax',
          method: 'post',
          body: ctx.params,
        });
      },
    },
    updateTax: {
      handler(ctx: Context<TaxRequestParams>) {
        const { id } = ctx.params;
        const body = ctx.params;
        delete body.id;
        return this.request({
          path: `tax/${id}`,
          method: 'put',
          body,
        });
      },
    },
    deleteTax: {
      handler(ctx: Context<TaxRequestParams>) {
        return this.request({
          path: `tax/${ctx.params.id}`,
          method: 'delete',
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
          (accumulator, key) =>
            `${accumulator}${accumulator ? '&' : '?'}${key}=${params[key]}`,
          ''
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
          this.adapter.insert({
            module: path.replace(/([a-z]+)[/|?].*/, '$1'),
            path,
            method,
            body,
            params,
            status: res.status,
            ok: res.ok,
            createdAt: new Date(),
            res: parsedRes,
          });
          if (!res.ok) {
            throw new MoleculerError(
              parsedRes &&
                parsedRes.error &&
                (parsedRes.error.details || parsedRes.error.message),
              res.status
            );
          }
          return parsedRes;
        })
        .catch((err: CommonError) => {
          throw new MoleculerError(err.message, err.code);
        });
    },
  },
};

export = TheService;
