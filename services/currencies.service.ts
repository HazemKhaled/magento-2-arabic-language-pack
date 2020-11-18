import { Context, ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';

import { CurrenciesValidation, CurrenciesOpenapi } from '../utilities/mixins';
import { MpError } from '../utilities/adapters';
import { Currency } from '../types/currency.d';

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
      auth: ['Basic'],
      cache: {
        keys: ['currencyCode'],
        ttl: 60 * 60,
      },
      handler(ctx: Context<Currency>): Promise<Currency> {
        return ctx
          .call<Currency[]>('currencies.getCurrencies')
          .then(currencies => {
            const currency = currencies.find(
              currencyObj =>
                currencyObj.currencyCode === ctx.params.currencyCode
            );
            if (currency === undefined) {
              throw new MpError(
                'Currencies Service',
                'Currency code could not be found!',
                404
              );
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
      auth: ['Basic'],
      cache: {
        ttl: 60 * 60,
      },
      handler(): Promise<Currency[]> {
        return fetch('https://openexchangerates.org/api/latest.json', {
          method: 'get',
          headers: { Authorization: `Token ${process.env.OPENEXCHANGE_TOKEN}` },
        })
          .then(res => res.json())
          .then(newCurrencies =>
            Object.keys(newCurrencies.rates).map(currency => ({
              currencyCode: currency,
              rate: newCurrencies.rates[currency],
            }))
          );
      },
    },
  },
};

export = TheService;
