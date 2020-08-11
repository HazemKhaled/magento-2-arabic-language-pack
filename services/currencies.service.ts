import { Context, ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';
import { Currency } from './../types/currency.d';
import { CurrenciesValidation, CurrenciesOpenapi } from '../utilities/mixins';
import { MpError } from '../utilities/adapters';

const TheService: ServiceSchema = {
  name: 'currencies',
  mixins: [CurrenciesValidation, CurrenciesOpenapi],
  actions: {
    /**
     * Gets the rates of asked currency according to the dollar as a base
     *
     * @param {string} currencyCode
     * @returns {Currency}
     */
    getCurrency: {
      auth: 'Basic',
      cache: {
        keys: ['currencyCode'],
        ttl: 60 * 60, // 1 hour
      },
      handler(ctx: Context) {
        return ctx.call('currencies.getCurrencies').then(currencies => {
          const currency = currencies.find(
            (currencyObj: Currency) => currencyObj.currencyCode === ctx.params.currencyCode,
          );
          if (currency === undefined) {
            throw new MpError('Currencies Service', 'Currency code could not be found!', 404);
          }
          return currency;
        });
      },
    },
    /**
     * Fetch all currencies rates from openexchange api
     *
     * @returns {Currency[]}
     */
    getCurrencies: {
      auth: 'Basic',
      cache: {
        ttl: 60 * 60, // 1 hour
      },
      handler() {
        return fetch('https://openexchangerates.org/api/latest.json', {
          method: 'get',
          headers: { Authorization: `Token ${process.env.OPENEXCHANGE_TOKEN}` },
        })
          .then(res => res.json())
          .then(newCurrencies =>
            Object.keys(newCurrencies.rates).map(currency => ({
              currencyCode: currency,
              rate: newCurrencies.rates[currency],
            })),
          );
      },
    },
  },
};

export = TheService;
