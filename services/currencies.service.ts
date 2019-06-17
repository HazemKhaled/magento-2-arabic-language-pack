import { Context, ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';
import { Currency } from './../types/currency.d';

const TheService: ServiceSchema = {
  name: 'currencies',
  actions: {
    /**
     * Gets the rates of asked currency according to the dollar as a base
     *
     * @param {string} currencyCode
     * @returns {Currency}
     */
    getCurrency: {
      auth: 'Basic',
      params: {
        currencyCode: { type: 'string', min: 3, max: 3 }
      },
      cache: {
        keys: ['currencyCode'],
        ttl: 60 * 60 // 1 hour
      },
      handler(ctx: Context) {
        return ctx.call('currencies.getCurrencies').then(curruncies => {
          const currency = curruncies.find(
            (currencyObj: Currency) => currencyObj.currencyCode === ctx.params.currencyCode
          );
          if (currency === undefined) {
            ctx.meta.$statusCode = 404;
            return { warning: 'Currency code could not be found!' };
          }
          return currency;
        });
      }
    },
    /**
     * Fetch all currencies rates from openexchange api
     *
     * @returns {Currency[]}
     */
    getCurrencies: {
      auth: 'Basic',
      cache: {
        ttl: 60 * 60 // 1 hour
      },
      handler() {
        return fetch(`https://openexchangerates.org/api/latest.json`, {
          method: 'get',
          headers: { Authorization: `Token ${process.env.OPENEXCHANGE_TOKEN}` }
        })
          .then(res => res.json())
          .then(newCurrencies =>
            Object.keys(newCurrencies.rates).map(currency => ({
              currencyCode: currency,
              rate: newCurrencies.rates[currency]
            }))
          );
      }
    }
  }
};

export = TheService;