const ElasticLib = require('../libs/elastic');
const KlayerLib = require('../libs/klayer');
const Loop = require('bluebird');

module.exports = {
  name: 'catalog',

  /**
   * Service settings
   */
  settings: {},

  /**
   * Service metadata
   */
  metadata: {},

  /**
   * Service dependencies
   */
  // dependencies: [],

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

        const klayer = new KlayerLib();
        let instance = await klayer.findInstance(ctx.meta.user);
        instance = instance['0'];

        const esClient = new ElasticLib();
        const product = await esClient.fetchProduct(
          'products',
          'Product',
          sku,
          instance
        );
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
      cache: false,
      // cache: {
      //   keys: ['page', 'limit'],
      //   ttl: 10 * 60 // 10 mins
      // },
      async handler(ctx) {
        const { page, limit } = ctx.params;

        const klayer = new KlayerLib();
        let instance = await klayer.findInstance(ctx.meta.user);
        instance = instance['0'];

        const esClient = new ElasticLib();
        const products = await esClient.findProducts(
          'products',
          'Product',
          instance,
          page,
          limit
        );

        return { products };
      }
    },

    /**
     * Get Products By Page
     *
     * @returns {Array} 10 - 1000  categories per page
     */
    listCategories: {
      auth: 'required',
      async handler() {
        const esClient = new ElasticLib();
        let categories = await esClient.fetch('categories', 'Category', 1);
        categories = await Loop.map(categories, category => ({
          id: category.odooId,
          name: category.name
        }));
        return categories;
      }
    }
  }
};
