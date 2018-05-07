

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
    product: {
      auth: 'required',
      async handler(ctx) {
        if (
          Object.keys(ctx.params).length > 0 &&
          ctx.params.hasOwnProperty('sku')
        ) {
          const es = require('../libs/elastic');
          const esClient = new es();
          const product = await esClient.fetchProduct(
            'products',
            'Product',
            ctx.params.sku
          );
          return product;
        }
        return {
          errorCode: 404,
          errorMessage: 'SKU(s) out of stock.',
          data: {}
        };
      }
    },

    /**
     * Get Products By Page
     *
     * @returns {Array} 10 - 1000 products per page
     */
    products: {
      auth: 'required',
      async handler(ctx) {
        const es = require('../libs/elastic');
        const esClient = new es();
        const KlayerLib = require('../libs/klayer');
        const klayer = new KlayerLib();
        let instance = await klayer.findInstance(ctx.meta.user);
        instance = instance[0];
        const products = await esClient.findProducts(
          'products',
          'Product',
          instance,
          ctx.params.hasOwnProperty('page') ? ctx.params.page : undefined
        );
        return products;
      }
    },

    /**
     * Get Products By Page
     *
     * @returns {Array} 10 - 1000  categories per page
     */
    categories: {
      auth: 'required',
      async handler(ctx) {
        const es = require('../libs/elastic');
        const esClient = new es();
        const categories = await esClient.fetch(
          'categories',
          'Category',
          ctx.params.hasOwnProperty('page') ? ctx.params.page : undefined
        );
        return categories;
      }
    }
  },

  /**
   * Events
   */
  events: {},

  /**
   * Methods
   */
  methods: {},

  /**
   * Service created lifecycle event handler
   */
  created() {},

  /**
   * Service started lifecycle event handler
   */
  started() {},

  /**
   * Service stopped lifecycle event handler
   */
  stopped() {}
};
