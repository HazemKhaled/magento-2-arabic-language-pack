import { Context, Errors, ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';
import { Invoice } from '../utilities/types';
import { CreateInvoiceValidation } from '../utilities/validations';
const MoleculerError = Errors.MoleculerError;

const TheService: ServiceSchema = {
  name: 'invoices',
  settings: {
    AUTH: Buffer.from(`${process.env.BASIC_USER}:${process.env.BASIC_PASS}`).toString('base64')
  },
  actions: {
    get: {
      auth: 'Bearer',
      cache: {
        keys: ['#user', 'page', 'limit', 'reference_number', 'invoice_number'],
        ttl: 60 * 60
      },
      params: {
        page: { type: 'number', integer: true, optional: true, convert: true },
        limit: { type: 'number', integer: true, optional: true, convert: true },
        reference_number: { type: 'string', optional: true },
        invoice_number: { type: 'string', optional: true }
      },
      async handler(ctx: Context) {
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user
        });
        const url = new URL(`${process.env.OMS_BASEURL}/invoices/${instance.internal_data.omsId}`);
        const keys: { [key: string]: string } = {
          page: 'page',
          limit: 'perPage',
          reference_number: 'referenceNumber',
          invoice_number: 'invoiceNumber'
        };
        Object.keys(ctx.params).forEach(key => {
          if (ctx.params[key]) url.searchParams.append(keys[key], ctx.params[key]);
        });
        if (instance.internal_data && instance.internal_data.omsId) {
          return fetch(url.href, {
            method: 'get',
            headers: {
              Authorization: `Basic ${this.settings.AUTH}`
            }
          })
            .then(async res => {
              const response = await res.json();
              if (!res.ok) {
                response.status = res.status;
                response.statusText = res.statusText;
                throw response;
              }
              return {
                invoices: response.invoices.map((invoice: Invoice) => ({
                  invoice_id: invoice.invoiceId,
                  customer_name: invoice.customerName,
                  customer_id: invoice.customerId,
                  status: invoice.status,
                  invoice_number: invoice.invoiceNumber,
                  reference_number: invoice.referenceNumber,
                  date: invoice.date,
                  due_date: invoice.dueDate,
                  due_days: invoice.dueDays,
                  total: invoice.total,
                  balance: invoice.balance,
                  created_time: invoice.createdTime,
                  last_modified_time: invoice.lastModifiedTime,
                  shipping_charge: invoice.shippingCharge,
                  adjustment: invoice.adjustment
                }))
              };
            })
            .catch(err => {
              ctx.meta.$statusCode = err.status || (err.error && err.error.statusCode) || 500;
              ctx.meta.$statusMessage =
                err.statusText || (err.error && err.error.name) || 'Internal Error';
              return {
                errors: [
                  {
                    message: err.error ? err.error.message : 'Internal Server Error'
                  }
                ]
              };
            });
        }
        ctx.meta.$statusCode = 404;
        ctx.meta.$statusMessage = 'Not Found';
        return {
          errors: [
            {
              message: 'No Record Found For This Store!'
            }
          ]
        };
      }
    },
    create: {
      auth: 'Basic',
      params: CreateInvoiceValidation,
      async handler(ctx: Context) {
        const instance = await ctx.call('stores.findInstance', {
          id: ctx.params.storeId
        });
        if(instance.errors) {
          throw new MoleculerError('Store not found', 404);
        }
        const url = `${process.env.OMS_BASEURL}/invoices`
        return fetch(url, {
          method: 'post',
          body: JSON.stringify({
            customerId: instance.internal_data.omsId,
            discount: ctx.params.discount && ctx.params.discount.value,
            discountType: ctx.params.discount && ctx.params.discount.type,
            items: ctx.params.items
          }),
          headers: {
            Authorization: `Basic ${this.settings.AUTH}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        })
        .then(res => this.responseCheck(res))
        .then(res => {
          this.broker.cacher.clean(`invoices.get:${instance.consumer_key}*`);
          return res;
        })
        .catch(err => {throw new MoleculerError(err.message, err.code || 500)});
      }
    },
    applyCredits: {
      auth: 'Bearer',
      params: {
        id: { type: 'string' }
      },
      async handler(ctx: Context) {
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user
        });
        if(instance.errors) {
          throw new MoleculerError('Store not found', 404);
        }
        const url = `${process.env.OMS_BASEURL}/invoices/${instance.internal_data.omsId}/${ctx.params.id}/credits`;
        return fetch(url, {
          method: 'post',
          headers: {
            Authorization: `Basic ${this.settings.AUTH}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        })
        .then(res => this.responseCheck(res))
        .then(res => {
          this.broker.cacher.clean(`invoices.get:${instance.consumer_key}*`);
          this.broker.cacher.clean(`stores.get:${instance.url}*`);
          this.broker.cacher.clean(`stores.me:${instance.consumer_key}*`);
          return res;
        })
        .catch(err => {throw new MoleculerError(err.message, err.code || 500)});
      }
    },
  },
  methods: {
    async responseCheck(responseCursor) {
      const response = await responseCursor.json();
      if(!responseCursor.ok) {
        throw new MoleculerError(response.message || response.error.message || response, responseCursor.status)
      }
      return response;
    }
  }
};

export = TheService;
