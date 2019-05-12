import { ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';

export const CurrenciesService: ServiceSchema = {
  name: 'currencies',
  settings: {
    AUTH: Buffer.from(`${process.env.BASIC_USER}:${process.env.BASIC_PASS}`).toString('base64')
  },
  actions: {
    getCurrency: {
      params: {
        currencyCode: { type: 'string', min: 3, max: 3 }
      },
      cache: {
        key: ['currencyCode'],
        ttl: 30 * 60 // 1 hour
      },
      handler(ctx: any) {
        return fetch(`${process.env.OMS_URL}/currencies/${ctx.params.currency}`, {
          method: 'get',
          headers: {
            Authorization: `Basic ${this.settings.AUTH}`
          }
        }).then(res => res.json());
        // TODO: transform currency before response
      }
    },
    getCurrencies: {
      cache: {
        ttl: 30 * 60 // 1 hour
      },
      handler() {
        return fetch(`${process.env.OMS_URL}/currencies`, {
          method: 'get',
          headers: {
            Authorization: `Basic ${this.settings.AUTH}`
          }
        }).then(res => res.json());
      }
    }
  }
};
