import { ServiceSchema } from 'moleculer';
import * as Cron from 'moleculer-cron';
import * as DbService from 'moleculer-db';
import fetch from 'node-fetch';
import { Currency } from './../types/currency.d';

const TheService: ServiceSchema = {
  name: 'currencies',
  mixins: [Cron, DbService],
  adapter: new DbService.MemoryAdapter({ filename: './data/currency.db' }),
  actions: {
    getCurrency: {
      auth: 'Basic',
      params: {
        currencyCode: { type: 'string', min: 3, max: 3 }
      },
      cache: {
        key: ['currencyCode'],
        ttl: 60 * 60 // 1 hour
      },
      handler(ctx: any) {
        return ctx
          .call('currencies.find', {
            query: { _id: ctx.params.currencyCode.toUpperCase() }
          })
          .then(async (currency: Currency[]) => {
            if (
              currency.length === 0 ||
              new Date(currency[0].lastUpdate).getTime() - Date.now() > 3600 * 1000
            ) {
              currency = await ctx.call('currencies.getCurrencies').then(() =>
                ctx.call('currencies.find', {
                  query: { _id: ctx.params.currencyCode.toUpperCase() }
                })
              );
            }
            if (currency.length === 0) {
              ctx.meta.$statusCode = 404;
              return { warning: 'Currency code could not be found!' };
            }
            delete currency[0].lastUpdate;
            currency[0].currencyCode = currency[0]._id;
            delete currency[0]._id;
            return currency;
          });
      }
    },
    getCurrencies: {
      auth: 'Basic',
      cache: {
        ttl: 60 * 60 // 1 hour
      },
      handler(ctx) {
        return ctx.call('currencies.find').then(async (currencies: Currency[]) => {
          // If rates are more than 1 hour
          let rates = currencies;
          if (
            currencies.length === 0 ||
            new Date(currencies[0].lastUpdate).getTime() - Date.now() > 3600 * 1000
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
                return ctx.call('currencies.insert', { entities: currenciesObj });
              });
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
