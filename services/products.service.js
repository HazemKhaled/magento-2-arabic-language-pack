const ESService = require('moleculer-elasticsearch');
const Loop = require('bluebird');
const { MoleculerClientError } = require('moleculer').Errors;
const AgileCRM = require('../mixins/agilecrm.mixin');
const KlayerAPI = require('../libs/klayer');

module.exports = {
  name: 'products',
  /**
   * Service settings
   */
  settings: {
    elasticsearch: {
      host: `http://${process.env.ELASTIC_AUTH}@${process.env.ELASTIC_HOST}:${
        process.env.ELASTIC_PORT
      }`
    }
  },

  /**
   * Service metadata
   */
  metadata: {},

  /**
   * Service Mixins
   */
  mixins: [ESService, AgileCRM],

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
        const product = await this.fetchProduct(sku, ctx.meta.user, _source);
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
          max: 100,
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
        const products = await this.findProducts(page, limit, ctx.meta.user, _source, lastupdate);

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

        const product = await this.deleteProduct(sku, ctx.meta.user);
        return { product };
      }
    }
  },
  methods: {
    /**
     * Get Product By SKU
     *
     * @param {Object} instance
     * @returns {Object} Product
     * @memberof ElasticLib
     */
    async fetchProduct(sku, id, _source) {
      const api = new KlayerAPI();
      const [instance] = await api.findInstance(id);

      try {
        const result = await this.broker.call('products.search', {
          index: 'products',
          type: 'Product',
          _source: _source,
          body: {
            query: {
              term: {
                sku: sku
              }
            }
          }
        });
        if (result.hits.total === 0) {
          return {
            status: 'failed',
            message: 'Product not found',
            sku: sku
          };
        }
        const rate = await api.currencyRate(instance.base_currency);
        const source = result.hits.hits[0]._source;
        return {
          sku: source.sku,
          name: this.formatI18nText(source.name),
          description: this.formatI18nText(source.description),
          last_check_date: source.last_check_date,
          supplier: source.seller_id,
          images: source.images,
          categories: await this.formatCategories(source.categories),
          attributes: await this.formatAttributes(source.attributes),
          variations: await this.formatVariations(source.variations, instance, rate, source.archive)
        };
      } catch (err) {
        return new Error(err);
      }
    },
    /**
     * Get products by instance
     *
     * @param {Number} page
     * @param {Number} limit
     * @returns {Array} Products
     * @memberof ElasticLib
     */
    async findProducts(page, _size, id, _source, lastupdate = '') {
      const api = new KlayerAPI();
      const [instance] = await api.findInstance(id);

      const size = _size || 10;
      const instanceProductsFull = await this.findIP(page, size, instance, lastupdate);

      const instanceProducts = await Loop.map(instanceProductsFull, async product => {
        const source = product._source;
        return source.sku;
      });

      if (instanceProducts.length === 0) {
        return instanceProducts;
      }
      try {
        const search = await this.broker.call('products.call', {
          api: 'mget',
          params: {
            index: 'products',
            type: 'Product',
            _source: _source,
            body: {
              ids: instanceProducts
            }
          }
        });

        const results = search.docs;

        const rate = await api.currencyRate(instance.base_currency);
        try {
          const products = await Loop.map(results, async product => {
            if (product.found) {
              const source = product._source;

              return {
                sku: source.sku,
                name: this.formatI18nText(source.name),
                description: this.formatI18nText(source.description),
                supplier: source.seller_id,
                images: source.images,
                last_check_date: source.last_check_date,
                categories: await this.formatCategories(source.categories),
                attributes: await this.formatAttributes(source.attributes),
                variations: await this.formatVariations(
                  source.variations,
                  instance,
                  rate,
                  source.archive
                )
              };
            }
            // In case product not found at products instance
            if (product._id) {
              const blankProduct = {
                sku: product._id,
                images: [],
                categories: []
              };
              instanceProductsFull.forEach(instanceProduct => {
                const productSource = instanceProduct._source;
                if (productSource.sku === product._id && productSource.variations) {
                  blankProduct.variations = productSource.variations.map(variation => {
                    const variant = variation;
                    variant.quantity = 0;
                    return variant;
                  });
                }
              });
              return blankProduct;
            }
          });

          return products.filter(product => !!product && product.variations.length !== 0);
        } catch (err) {
          return new MoleculerClientError(err);
        }
      } catch (err) {
        return new MoleculerClientError(err, 500);
      }
    },

    /**
     * Get Products-Instances by Instance Hash
     *
     * @param {Object} instance
     * @param {Number} page
     * @returns {Array} Instance Products
     * @memberof ElasticLib
     */
    async findIP(
      page,
      _size,
      instance,
      lastUpdated = '',
      fullResult = [], // all products from scroll pages
      trace = 0, // to trace the end product needed and stop scrolling after reaching it
      scrollId = false, // sending the scroll id on the callback
      maxScroll = 0 // just tracking to total products number to the scroll limit to stop if no more products
    ) {
      const size = _size || 10;
      let endTrace = trace;
      page = parseInt(page) || 1;
      let max = maxScroll;
      let search = [];
      try {
        if (!scrollId) {
        const searchQuery = {
          index: 'products-instances',
          type: 'product',
            scroll: '1m',
            size: process.env.SCROLL_LIMIT,
          body: {
            sort: [{ createdAt: { order: 'asc' } }],
            query: {
              bool: {
                filter: {
                  bool: {
                    must_not: [{ term: { deleted: true } }],
                    must: [{ match: { instanceId: instance.webhook_hash } }]
                  }
                }
              }
            }
          }
        };

        if (lastUpdated && lastUpdated !== '') {
          const lastUpdatedDate = new Date(Number(lastUpdated) * 1000).toISOString();
          searchQuery.body.query.bool.should = [];
          searchQuery.body.query.bool.minimum_should_match = 1;
          searchQuery.body.query.bool.should.push({
            range: {
              updated: {
                gte: lastUpdatedDate
              }
            }
          });
          searchQuery.body.query.bool.should.push({
            range: {
              createdAt: {
                gte: lastUpdatedDate
              }
            }
          });
        }
          endTrace = page * size;
          search = await this.broker.call('products.search', searchQuery);
          max = search.hits.total;
        } else {
          search = await this.broker.call('products.call', {
            api: 'scroll',
            params: { scroll: '30s', scrollId: scrollId }
          });
        }
        if (endTrace > size && max > parseInt(process.env.SCROLL_LIMIT)) {
      } catch (err) {
        return new MoleculerClientError(err, 500);
      }
    },

    /**
     * Delete Product By SKU
     *
     * @param SKU
     * @param id Intance ID
     * @returns {Object} Status of delete product
     * @memberof ElasticLib
     */
    async deleteProduct(sku, id) {
      try {
        const result = await this.broker.call('products.update', {
          index: 'products-instances',
          type: 'product',
          id: `${id}-${sku}`,
          body: {
            doc: {
              deleted: true,
              delete_date: new Date()
            }
          }
        });
        if (result._shards.successful > 0) {
          return {
            status: 'success',
            message: 'Product has been deleted.',
            sku: sku
          };
        }
        return {};
      } catch (err) {
        if (err.message) {
          return {
            status: 'failed',
            message: err.message,
            sku: sku
          };
        }
        return new Error(err);
      }
    },
    /**
     * Pick only language keys
     *
     * @param {Object} obj
     * @returns
     * @memberof ElasticLib
     */
    formatI18nText(obj) {
      if (!obj) return;

      const output = {};

      ['ar', 'en', 'tr', 'fr'].forEach(key => {
        if (obj[key] && key.length === 2) {
          output[key] = typeof obj[key] === 'string' ? obj[key] : obj[key].text;
        }
      });

      // Cleanup null values
      Object.keys(output).forEach(k => {
        if (!output[k]) delete output[k];
      });

      return Object.keys(output).length ? output : false;
    },
    /**
     * Format Variations
     *
     * @param {Array} variations
     * @param {Object} instance
     * @param {Number} rate
     * @returns {Array} Transformed Variations
     * @memberof ElasticLib
     */
    async formatVariations(variations, instance, rate, archive) {
      if (variations) {
        variations = await Loop.map(variations, async variation => {
          if (variation) {
            return {
              sku: variation.sku,
              cost_price: variation.sale * rate,
              sale_price:
                instance.salePriceOprator === 1
                  ? variation.sale * instance.salePrice * rate
                  : variation.sale * rate + instance.salePrice,
              market_price:
                instance.comparedAtPriceOprator === 1
                  ? variation.sale * instance.comparedAtPrice * rate
                  : variation.sale * rate + instance.comparedAtPrice,
              weight: variation.weight,
              attributes: await this.formatAttributes(variation.attributes),
              quantity: archive ? 0 : variation.quantity
            };
          }
        });
        return variations;
      }
    },

    /**
     * Format Categories
     *
     * @param {Array} categories
     * @returns {Array} Categories
     * @memberof ElasticLib
     */
    async formatCategories(categories) {
      if (categories) {
        categories = await Loop.map(categories, async category => {
          if (category) {
            return {
              id: category.odooId,
              name: this.formatI18nText(category.name_i18n)
            };
          }
        });
        return categories;
      }
    },

    /**
     * Format Attributes
     *
     * @param {Array} attributes
     * @returns {Array} Formatted Attributes
     * @memberof ElasticLib
     */
    async formatAttributes(attributes) {
      if (attributes) {
        attributes = await Loop.map(attributes, async attribute => {
          if (attribute && typeof attribute.name === 'string') {
            return {
              id: attribute.id,
              name: {
                en: attribute.name
              },
              option: {
                en: attribute.option
              }
            };
          }
          return attribute;
        });
        return attributes;
      }
    }
  },

  events: {
    // Subscribe 'list.afterRemote' which will get emit after list action called.
    'list.afterRemote': {
      async handler(payload) {
        if (payload.meta && payload.meta.user) {
          const klayer = new KlayerAPI();
          const [instance] = await klayer.findInstance(payload.meta.user);
          if (instance && instance.partner_id) {
            this.updateLastSyncDate(instance.partner_id);
          }
        }
      }
    }
  }
};
