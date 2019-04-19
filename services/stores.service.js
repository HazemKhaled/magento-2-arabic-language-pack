const request = require('request-promise');
const { MoleculerClientError } = require('moleculer').Errors;

module.exports = {
  name: 'stores',
  settings: {
    API_URL: process.env.STORES_URL || 'https://dev.stores.knawat.io',
    AUTH: Buffer.from(`${process.env.STOREUSER}:${process.env.STOREPASS}`).toString('base64')
  },
  actions: {
    findInstance: {
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
      auth: 'required',
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
