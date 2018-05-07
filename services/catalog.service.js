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
        const KlayerLib = require('../libs/klayer');
        const klayer = new KlayerLib();
        let instance = await klayer.findInstance(ctx.meta.user);
        instance = instance['0'];
        if (
          Object.keys(ctx.params).length > 0 &&
          ctx.params.hasOwnProperty('sku')
        ) {
          const Es = require('../libs/elastic');
          const esClient = new Es();
          const product = await esClient.fetchProduct(
            'products',
            'Product',
            ctx.params.sku,
            instance
          );
          return product;
        }
        return {
          errorCode: 404,
          errorMessage: 'SKU(s) not found or No SKU was requested',
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
        const Es = require('../libs/elastic');
        const esClient = new Es();
        const KlayerLib = require('../libs/klayer');
        const klayer = new KlayerLib();
        let instance = await klayer.findInstance(ctx.meta.user);
        instance = instance['0'];
        const products = await esClient.findProducts(
          'products',
          'Product',
          instance,
          ctx.params.hasOwnProperty('page') ? ctx.params.page : undefined
        );
        return {
          meta: {
            total: products.length
          },
          data: products
        };
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
        const Es = require('../libs/elastic');
        const esClient = new Es();
        const Loop = require('bluebird');
        let categories = await esClient.fetch(
          'categories',
          'Category',
          1
        );
        categories = await Loop.map(categories, category => ({
          id: category.odooId,
          name: category.name
        }));
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
