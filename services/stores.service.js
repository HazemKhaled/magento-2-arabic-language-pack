const request = require('request-promise');
const { MoleculerClientError } = require('moleculer').Errors;

module.exports = {
  name: 'stores',
  settings: {
    API_URL: process.env.STORES_URL || 'https://dev.stores.knawat.io',
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
      handler(ctx) {
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
      handler(ctx) {
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
      handler(ctx) {
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
      handler(ctx) {
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
        status: { type: 'enum', values: ['confirmed', 'unconfirmed', 'archived'] },
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
            'other'
          ]
        },
        stock_date: { type: 'date', optional: true },
        stock_status: { type: 'enum', values: ['idle', 'in-progress'], optional: true },
        price_date: { type: 'date', optional: true },
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
        errors: { type: 'array', items: { type: 'object' }, optional: true }
      },
      handler(ctx) {
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
        name: { type: 'string' },
        status: { type: 'enum', values: ['confirmed', 'unconfirmed', 'archived'] },
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
            'other'
          ]
        },
        stock_date: { type: 'date', optional: true },
        stock_status: { type: 'enum', values: ['idle', 'in-progress'], optional: true },
        price_date: { type: 'date', optional: true },
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
        errors: { type: 'array', items: { type: 'object' }, optional: true }
      },
      handler(ctx) {
        const { id } = ctx.params;
        delete ctx.params.id;
        ctx.params.url = id;
        return request({
          method: 'put',
          uri: this.getUrl(`stores/${encodeURIComponent(id)}`),
          headers: {
            Authorization: `Basic ${this.settings.AUTH}`
          },
          body: ctx.params,
          json: true
        });
      }
    }
  },
  methods: {
    /**
     * Get Formatted URL
     *
     * @param {String} endpoint
     * @returns {String} URL
     * @memberof KlayerService
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
