import { Context, ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';

const TheService: ServiceSchema = {
  name: 'payments',
  settings: {
    AUTH: Buffer.from(`${process.env.BASIC_USER}:${process.env.BASIC_PASS}`).toString('base64')
  },
  actions: {
    add: {
      auth: 'Basic',
      params: {
        storeId: [{ type: 'string' }, { type: 'number', integer: true }],
        payment_mode: { type: 'string' },
        amount: { type: 'number' },
        invoices: {
          type: 'array',
          item: {
            type: 'object',
            props: {
              amount_applied: { type: 'number', convert: true },
              invoice_id: { type: 'string' }
            }
          },
          optional: true
        },
        account_id: { type: 'string', optional: true },
        bank_charges: { type: 'number', optional: true, convert: true }
      },
      async handler(ctx: Context) {
        const instance = await ctx.call('stores.findInstance', {
          id: ctx.params.storeId
        });
        if (instance.internal_data && instance.internal_data.omsId) {
          return fetch(`${process.env.OMS_BASEURL}/payments/${instance.internal_data.omsId}`, {
            method: 'post',
            headers: {
              Authorization: `Basic ${this.settings.AUTH}`,
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify({
              payment_mode: ctx.params.payment_mode,
              amount: ctx.params.amount,
              invoices: ctx.params.invoices,
              account_id: ctx.params.account_id,
              bank_charges: ctx.params.bank_charges
            })
          })
            .then(async res => {
              const response = await res.json();
              if (!res.ok) {
                response.status = res.status;
                response.statusText = res.statusText;
                throw response;
              }
              return response;
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
    get: {
      auth: 'Bearer',
      params: {
        page: { type: 'number', integer: true, optional: true, convert: true },
        limit: { type: 'number', integer: true, optional: true, convert: true },
        reference_number: { type: 'string', optional: true },
        payment_mode: { type: 'string', optional: true }
      },
      async handler(ctx: Context) {
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user
        });
        const url = new URL(`${process.env.OMS_BASEURL}/invoices/${instance.internal_data.omsId}`);
        const keys: { [key: string]: string } = {
          page: 'page',
          limit: 'perPage',
          reference_number: 'reference_number',
          payment_mode: 'payment_mode'
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
              return response;
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
    }
  }
};

export = TheService;
