import { Context, ServiceSchema } from 'moleculer';
import * as Cron from 'moleculer-cron';
import * as DbService from 'moleculer-db';
import fetch from 'node-fetch';
import { Currency } from './../types/currency.d';

const TheService: ServiceSchema = {
  name: 'currencies',
  mixins: [Cron, DbService],
  adapter: new DbService.MemoryAdapter({ filename: './data/currency.db' }),
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
     * Fetch all currencies rates from openexchange api then saves it to local db
     *
     * @returns {Currency[]}
     */
    getCurrencies: {
      auth: 'Basic',
      cache: {
        ttl: 60 * 60 // 1 hour
      },
      handler(ctx: Context) {
        return ctx.call('currencies.find').then(async (currencies: Currency[]) => {
          // If rates are more than 1 hour
          let rates = currencies;
          if (
            currencies.length === 0 ||
            Date.now() - new Date(currencies[0].lastUpdate).getTime() > 3600 * 1000
          ) {
            // Get new rates
            rates = await fetch(`https://openexchangerates.org/api/latest.json`, {
              method: 'get',
              headers: { Authorization: `Token ${process.env.OPENEXCHANGE_TOKEN}` }
            })
              .then(res => res.json())
              .then(newCurrencies => {
                const currenciesObj = Object.keys(newCurrencies.rates).map(currency => ({
                  _id: currency,
                  rate: newCurrencies.rates[currency],
                  lastUpdate: new Date()
                }));

                // Push the new rates into the DB
                return Promise.all(
                  currenciesObj.map(currencyObj => ctx.call('currencies.update', currencyObj))
                );
              });
            // clean the cache after db update
            this.broker.cacher.clean(`currencies.**`);
          }

          // Return the currencies rates
          return rates.map((currency: Currency) => ({
            currencyCode: currency._id,
            rate: currency.rate
          }));
        });
      }
    }
  }
};

export = TheService;
