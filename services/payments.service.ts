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
              bank_charges: ctx.params.bank_charges
            })
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
