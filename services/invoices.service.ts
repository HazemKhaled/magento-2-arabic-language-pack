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
      async handler(ctx: Context) {
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user
        });
        if (instance.internal_data && instance.internal_data.omsId) {
          return fetch(`${process.env.OMS_BASEURL}/invoices/${instance.internal_data.omsId}`, {
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
