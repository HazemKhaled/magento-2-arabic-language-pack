const ElasticLib = require('../libs/elastic');
const { MoleculerClientError } = require('moleculer').Errors;

module.exports = {
  name: 'products',

  /**
   * Service settings
   */
  settings: {},

  /**
   * Service metadata
   */
  metadata: {},

  /**
   * Actions
   */
  actions: {
    /**
     * Get product by SKU
     *
     * @returns {Object} Product
     */
    get: {
      auth: 'required',
      cache: false,
      async handler(ctx) {
        const { sku } = ctx.params;
        const esClient = new ElasticLib();
        const product = await esClient.fetchProduct(sku, ctx.meta.user);
        return { product };
      }
    },

    /**
     * Get Products By Page
     *
     * @returns {Array} 10 - 1000 products per page
     */
    list: {
      auth: 'required',
      cache: {
        keys: ['page', 'limit', '#token'],
        ttl: 10 * 60 // 10 mins
      },
      async handler(ctx) {
        const { page, limit } = ctx.params;
        if (limit > 1000) {
          return this.Promise.reject(
            new MoleculerClientError(
              'Maximum Limit is 1000 !',
              422,
              '',
              [
                { field: 'limit', message: 'Max limit is 1000' },
              ]
            )
          );
        }
        const esClient = new ElasticLib();
        const products = await esClient.findProducts(page, limit, ctx.meta.user);

        return { products };
      }
    }
  }
};
