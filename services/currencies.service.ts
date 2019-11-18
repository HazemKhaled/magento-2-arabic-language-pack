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
      openapi: {
        $path: 'get /currencies/{currencyCode}',
        summary: 'Get Currency By Code',
        tags: ['Currencies', 'Enterprise Only'],
        description: 'Gets currency code, name and rate',
        parameters: [
          {
            name: 'currencyCode',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              minLength: 3,
              maxLength: 3
            }
          },
          {
            name: 'currencyCode',
            in: 'path',
            required: true,
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Status 200',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Currency'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/UnauthorizedErrorBasic'
          },
          '404': {
            description: 'Status 404'
          }
        },
        security: [
          {
            basicAuth: []
          }
        ]
      },
      auth: 'Basic',
      cache: {
        keys: ['currencyCode'],
        ttl: 60 * 60 // 1 hour
      },
      params: {
        currencyCode: { type: 'string', min: 3, max: 3 }
      },
      handler(ctx: Context) {
        return ctx.call('currencies.getCurrencies').then(currencies => {
          const currency = currencies.find(
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
      openapi: {
        $path: 'get /currencies',
        summary: 'Get Currencies',
        tags: ['Currencies', 'Enterprise Only'],
        description: 'Get all currencies with names, code and rates info',
        responses: {
          '200': {
            description: 'Status 200',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Currency'
                  }
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/UnauthorizedErrorBasic'
          }
        },
        security: [
          {
            basicAuth: []
          }
        ]
      },
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
