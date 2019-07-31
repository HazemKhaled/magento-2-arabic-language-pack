import { Context, ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';

const TheService: ServiceSchema = {
  name: 'invoices',
  settings: {
    AUTH: Buffer.from(`${process.env.BASIC_USER}:${process.env.BASIC_PASS}`).toString('base64')
  },
  actions: {
    get: {
      auth: 'Basic',
      params: {
        storeId: [{ type: 'string' }, { type: 'number', integer: true }]
      },
      handler(ctx: Context) {
        this.logger.info(ctx.params.storeId);
        return fetch(`${process.env.OMS_BASEURL}/invoices/${ctx.params.storeId}`, {
          method: 'get',
          headers: {
            Authorization: `Basic ${this.settings.AUTH}`
          }
        }).then(res => res.json());
      }
    }
  }
};

export = TheService;
