const { MoleculerClientError } = require('moleculer').Errors;
const AgileCRM = require('../mixins/agilecrm.mixin');

const ElasticLib = require('../libs/elastic');
const KlayerLib = require('../libs/klayer');

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
   * Service Mixins
   */
  mixins: [AgileCRM],

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
      cache: { keys: ['sku'], ttl: 60 },
      async handler(ctx) {
        const { sku } = ctx.params;
        let { _source } = ctx.params;

        const fields = [
          'sku',
          'name',
          'description',
          'last_stock_check',
          'seller_id',
          'images',
          'last_check_date',
          'categories',
          'attributes',
          'variations'
        ];
        // _source contains specific to be returned
        if (Array.isArray(_source)) {
          _source = _source.map(field => (fields.includes(field) ? field : null));
        } else {
          _source = fields.includes(_source) ? _source : null;
        }
        const esClient = new ElasticLib();
        const product = await esClient.fetchProduct(sku, ctx.meta.user, _source);
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
      params: {
        limit: {
          type: 'number',
          convert: true,
          integer: true,
          min: 1,
          max: 1000,
          optional: true
        },
        page: { type: 'number', convert: true, integer: true, min: 1, optional: true },
        lastupdate: { type: 'string', empty: false, optional: true }
      },
      cache: {
        keys: ['page', 'limit', 'lastupdate', '#token', '_source'],
        ttl: 30 * 60 // 10 mins
      },
      async handler(ctx) {
        const { page, limit, lastupdate = '' } = ctx.params;
        let { _source } = ctx.params;
        if (limit > 1000) {
          return this.Promise.reject(
            new MoleculerClientError('Maximum Limit is 1000 !', 422, '', [
              { field: 'limit', message: 'Max limit is 1000' }
            ])
          );
        }
        const fields = [
          'sku',
          'name',
          'description',
          'last_stock_check',
          'seller_id',
          'images',
          'last_check_date',
          'categories',
          'attributes',
          'variations'
        ];
        // _source contains specific to be returned
        if (Array.isArray(_source)) {
          _source = _source.map(field => (fields.includes(field) ? field : null));
        } else {
          _source = fields.includes(_source) ? _source : null;
        }
        const esClient = new ElasticLib();
        const products = await esClient.findProducts(
          page,
          limit,
          ctx.meta.user,
          _source,
          lastupdate
        );
        // Emit async Event
        ctx.emit('list.afterRemote', ctx);
        return { products };
      }
    },

    /**
     * Delete product by SKU
     *
     * @returns {Object} Product
     */
    delete: {
      auth: 'required',
      params: {
        sku: { type: 'string' }
      },
      async handler(ctx) {
        const { sku } = ctx.params;

        const esClient = new ElasticLib();
        const product = await esClient.deleteProduct(sku, ctx.meta.user);
        return { product };
      }
    }
  },

  events: {
    // Subscribe 'list.afterRemote' which will get emit after list action called.
    'list.afterRemote': {
      async handler(payload) {
        if (payload.meta && payload.meta.user) {
          const klayer = new KlayerLib();
          const [instance] = await klayer.findInstance(payload.meta.user);
          if (instance && instance.partner_id) {
            this.updateLastSyncDate(instance.partner_id);
          }
        }
      }
    }
  }
};
