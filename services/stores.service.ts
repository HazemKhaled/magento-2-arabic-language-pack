import DbService from '../utilities/mixins/mongo.mixin';

import { Store } from '../utilities/types/store.type';
import { createValidation, updateValidation } from '../utilities/validations/stores.validate';

const TheService: ServiceSchema = {
  name: 'stores',
  settings: {
    API_URL: process.env.STORES_URL,
    AUTH: Buffer.from(`${process.env.BASIC_USER}:${process.env.BASIC_PASS}`).toString('base64')
  },
  actions: {
    findInstance: {
      auth: 'Basic',
      cache: {
        keys: ['consumerKey'],
        ttl: 60 * 60 // 1 hour
      },
      params: {
        consumerKey: { type: 'string', convert: true }
      },
      handler(ctx: Context) {
        return request({
          method: 'get',
          uri: this.getUrl(
            `stores?filter=${JSON.stringify({
              where: {
                consumer_key: ctx.params.consumerKey
              }
            })}`
          ),
          headers: {
            Authorization: `Basic ${this.settings.AUTH}`
          },
          json: true
        }).catch(error => {
          throw new MoleculerClientError(error.message, error.code, error.type, ctx.params);
        });
      }
    },
    me: {
      auth: 'Bearer',
      cache: {
        keys: ['#user'],
        ttl: 60 * 60 // 1 hour
      },
      handler(ctx: Context) {
        return request({
          method: 'get',
          uri: this.getUrl(
            `stores?filter=${JSON.stringify({
              where: {
                consumer_key: ctx.meta.user
              }
            })}`
          ),
          headers: {
            Authorization: `Basic ${this.settings.AUTH}`
          },
          json: true
        }).catch(error => {
          throw new MoleculerClientError(error.message, error.code, error.type, ctx.params);
        });
      }
    },
    get: {
      auth: 'Basic',
      params: {
        id: { type: 'string' }
      },
      cache: {
        keys: ['id'],
        ttl: 60 * 60 // 1 hour
      },
      handler(ctx: Context) {
        return request({
          method: 'get',
          uri: this.getUrl(`stores/${encodeURIComponent(ctx.params.id)}`),
          headers: {
            Authorization: `Basic ${this.settings.AUTH}`
          }
        }).then(res => JSON.parse(res));
      }
    },
    list: {
      auth: 'Basic',
      params: {
        filter: { type: 'string' }
      },
      cache: {
        keys: ['filter'],
        ttl: 60 * 60 // 1 hour
      },
      handler(ctx: Context) {
        return request({
          method: 'get',
          uri: this.getUrl(`stores?filter=${ctx.params.filter}`),
          headers: {
            Authorization: `Basic ${this.settings.AUTH}`
          }
        }).then(res => JSON.parse(res));
      }
    },
    create: {
      auth: 'Basic',
      params: {
        url: { type: 'url' },
        name: { type: 'string' },
        status: { type: 'enum', values: ['confirmed', 'unconfirmed', 'archived', 'error'] },
        type: {
          type: 'enum',
          values: [
            'woocommerce',
            'magento1',
            'magento2',
            'salla',
            'expandcart',
            'opencart',
            'shopify',
            'csv',
            'ebay',
            'api',
            'other'
          ]
        },
        stock_date: { type: 'date', optional: true, convert: true },
        stock_status: { type: 'enum', values: ['idle', 'in-progress'], optional: true },
        price_date: { type: 'date', optional: true, convert: true },
        price_status: { type: 'enum', values: ['idle', 'in-progress'], optional: true },
        sale_price: { type: 'number', optional: true },
        sale_price_operator: { type: 'number', optional: true },
        compared_at_price: { type: 'number', optional: true },
        compared_at_price_operator: { type: 'enum', values: [1, 2], optional: true },
        currency: { type: 'string', max: 3, optional: true },
        external_data: { type: 'object', optional: true },
        users: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              email: { type: 'email' },
              roles: {
                type: 'array',
                items: { type: 'enum', values: ['owner', 'accounting', 'products', 'orders'] }
              }
            }
          }
        },
        languages: { type: 'array', min: 1, max: 10, items: 'string' },
        logs: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              message: { type: 'string' },
              level: { type: 'string' },
              date: { type: 'date', optional: true, convert: true }
            }
          },
          optional: true
        },
        address: {
          type: 'object',
          props: {
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            company: { type: 'string', optional: true },
            address_1: { type: 'string' },
            address_2: { type: 'string', optional: true },
            city: { type: 'string', optional: true },
            state: { type: 'string', optional: true },
            postcode: { type: 'number', optional: true },
            country: { type: 'string', max: 2 },
            email: { type: 'email', optional: true },
            phone: { type: 'string', optional: true, convert: true }
          },
          optional: true
        }
      },
      handler(ctx: Context) {
        this.broker.cacher.clean(`stores.get:**`);
        this.broker.cacher.clean(`stores.list:**`);
        return request({
          method: 'post',
          uri: this.getUrl('stores'),
          headers: {
            Authorization: `Basic ${this.settings.AUTH}`
          },
          body: ctx.params,
          json: true
        });
      }
    },
    update: {
      auth: 'Basic',
      params: {
        id: { type: 'url' },
        name: { type: 'string', optional: true },
        status: {
          type: 'enum',
          values: ['confirmed', 'unconfirmed', 'archived', 'error'],
          optional: true
        },
        type: {
          type: 'enum',
          values: [
            'woocommerce',
            'magento1',
            'magento2',
            'salla',
            'expandcart',
            'opencart',
            'shopify',
            'csv',
            'ebay',
            'api',
            'other'
          ],
          optional: true
        },
        stock_date: { type: 'date', optional: true, convert: true },
        stock_status: { type: 'enum', values: ['idle', 'in-progress'], optional: true },
        price_date: { type: 'date', optional: true, convert: true },
        price_status: { type: 'enum', values: ['idle', 'in-progress'], optional: true },
        sale_price: { type: 'number', optional: true },
        sale_price_operator: { type: 'number', optional: true },
        compared_at_price: { type: 'number', optional: true },
        compared_at_price_operator: { type: 'enum', values: [1, 2], optional: true },
        currency: { type: 'string', max: 3, optional: true },
        external_data: { type: 'object', optional: true },
        users: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              email: { type: 'email' },
              roles: {
                type: 'array',
                items: { type: 'enum', values: ['owner', 'accounting', 'products', 'orders'] }
              }
            }
          },
          optional: true
        },
        languages: { type: 'array', min: 1, max: 10, items: 'string', optional: true },
        logs: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              message: { type: 'string' },
              level: { type: 'string' },
              date: { type: 'date', optional: true, convert: true }
            }
          },
          optional: true
        },
        address: {
          type: 'object',
          props: {
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            company: { type: 'string', optional: true },
            address_1: { type: 'string' },
            address_2: { type: 'string', optional: true },
            city: { type: 'string', optional: true },
            state: { type: 'string', optional: true },
            postcode: { type: 'number', optional: true },
            country: { type: 'string', max: 2 },
            email: { type: 'email', optional: true },
            phone: { type: 'string', optional: true, convert: true }
          },
          optional: true
        }
      },
      handler(ctx: Context) {
        const { id } = ctx.params;
        delete ctx.params.id;
        this.broker.cacher.clean(`stores.**`);
        return request({
          method: 'put',
          uri: this.getUrl(`stores/${encodeURIComponent(id)}`),
          headers: {
            Authorization: `Basic ${this.settings.AUTH}`
          },
          body: ctx.params,
          json: true
        }).then(res => {
          this.broker.cacher.clean(`products.list:${res.consumer_key}**`);
          this.broker.cacher.clean(`products.getInstanceProduct:${res.consumer_key}**`);
          this.broker.cacher.clean(`stores.findInstance:${res.consumer_key}`);
          return res;
        });
      }
    }
  },
  methods: {
    /**
     * Get Formatted URL
     *
     * @param {String} endpoint
     * @returns
     */
    getUrl(endpoint) {
      // if URL doesn't have / at the end add it
      const url =
        this.settings.API_URL.slice(-1) === '/'
          ? this.settings.API_URL
          : `${this.settings.API_URL}/`;
      // Concat the final URL
      return url + endpoint;
    }
  }
};

export = TheService;
