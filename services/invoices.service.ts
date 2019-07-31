import { Context, ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';

const TheService: ServiceSchema = {
  name: 'invoices',
  settings: {
    AUTH: Buffer.from(`${process.env.BASIC_USER}:${process.env.BASIC_PASS}`).toString('base64')
  },
  actions: {
    get: {
      auth: 'Bearer',
      // cache: { keys: ['#user'], ttl: 60 },
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
          reference_number: 'reference_number',
          invoice_number: 'invoice_number'
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
          }).then(res => res.json());
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
