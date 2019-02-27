const { MoleculerClientError } = require('moleculer').Errors;
const AgileCRM = require('../mixins/agilecrm.mixin');
const Transformation = require('../mixins/transformation.mixin');

module.exports = {
  name: 'products',

  /**
   * Service metadata
   */
  metadata: {},

  /**
   * Service Mixins
   */
  mixins: [AgileCRM, Transformation],

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
     * Get User total Products Number
     *
     * @return {Number}
     */
    count: {
      auth: 'required',
      handler(ctx) {
        return ctx
          .call('es.count', {
            body: {
              query: {
                bool: {
                  filter: [
                    {
                      term: {
                        'instanceId.keyword': ctx.meta.user
                      }
                    }
                  ],
                  must_not: [
                    {
                      term: { deleted: true }
                    },
                    {
                      term: { archive: true }
                    }
                  ]
                }
              }
            }
          })
          .then(res => {
            if (typeof res.count !== 'number') return new MoleculerClientError('Error', 500);
            return { total: res.count };
          });
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
        lastupdate: { type: 'string', empty: false, optional: true },
        keyword: { type: 'string', optional: true }
      },
      cache: {
        keys: ['#token', 'page', 'limit', 'lastupdate', '_source'],
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
        const products = await this.findProducts(
          page,
          limit,
          ctx.meta.user,
          _source,
          lastupdate,
          ctx.params.keyword
        );

        // Emit async Event
        ctx.emit('list.afterRemote', ctx);
        return products;
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
      handler(ctx) {
        const { sku } = ctx.params;

        return this.deleteProduct(sku, ctx.meta.user)
          .then(product => {
            this.broker.cacher.clean(`products.list:${ctx.meta.token}**`);
            return { product };
          })
          .catch(error => {
            throw MoleculerClientError(error);
          });
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
      const [instance] = await this.broker.call('klayer.findInstance', { consumerKey: id });

      try {
        const result = await this.broker
          .call('es.search', {
            index: 'products-instances',
            type: 'product',
            _source: _source,
            body: {
              query: {
                bool: {
                  filter: {
                    term: {
                      'sku.keyword': sku
                    }
                  }
                }
              }
            }
          })
          .then(res =>
            res.hits.total > 0
              ? this.broker.call('es.search', {
                  index: 'products',
                  type: 'Product',
                  _source: _source,
                  body: {
                    query: {
                      bool: {
                        filter: {
                          term: {
                            _id: sku
                          }
                        }
                      }
                    }
                  }
                })
              : res
          );
        if (result.hits.total === 0) {
          throw new MoleculerClientError('Product not found', 404, sku);
        }
        const rate = await this.broker.call('klayer.currencyRate', {
          currencyCode: instance.base_currency
        });
        const source = result.hits.hits[0]._source;
        return {
          sku: source.sku,
          name: this.formatI18nText(source.name),
          description: this.formatI18nText(source.description),
          last_check_date: source.last_check_date,
          supplier: source.seller_id,
          images: source.images,
          categories: this.formatCategories(source.categories),
          attributes: this.formatAttributes(source.attributes),
          variations: this.formatVariations(source.variations, instance, rate, source.archive)
        };
      } catch (err) {
        throw new MoleculerClientError(err.message, 404, sku);
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
    async findProducts(page, _size, id, _source, lastupdate = '', keyword) {
      const [instance] = await this.broker.call('klayer.findInstance', { consumerKey: id });
      const size = _size || 10;
      const instanceProductsFull = await this.findIP(page, size, instance, lastupdate, keyword);

      const instanceProducts = instanceProductsFull.page.map(product => {
        const source = product._source;
        return source.sku;
      });

      if (instanceProducts.length === 0) {
        return {
          products: [],
          total: instanceProductsFull.totalProducts
        };
      }
      try {
        const search = await this.broker.call('es.call', {
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

        const rate = await this.broker.call('klayer.currencyRate', {
          currencyCode: instance.base_currency
        });
        try {
          const products = results.map(product => {
            if (product.found) {
              const source = product._source;
              return {
                sku: source.sku,
                name: this.formatI18nText(source.name),
                description: this.formatI18nText(source.description),
                supplier: source.seller_id,
                images: source.images,
                last_check_date: source.last_check_date,
                categories: this.formatCategories(source.categories),
                attributes: this.formatAttributes(source.attributes),
                variations: this.formatVariations(source.variations, instance, rate, source.archive)
              };
            }
            // In case product not found at products instance
            if (product._id) {
              const blankProduct = {
                sku: product._id,
                images: [],
                categories: []
              };
              instanceProductsFull.page.forEach(instanceProduct => {
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
            return [];
          });

          return {
            products: products.filter(product => !!product && product.variations.length !== 0),
            total: instanceProductsFull.totalProducts
          };
        } catch (err) {
          return new MoleculerClientError(err, 500);
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
      keyword,
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
                  must_not: [{ term: { deleted: true } }],
                  must: [{ term: { 'instanceId.keyword': instance.webhook_hash } }]
                }
              }
            }
          };
          if (keyword && keyword !== '')
            searchQuery.body.query.bool.must.push({
              multi_match: {
                query: keyword,
                fields: ['sku.keyword', 'variations.sku.keyword'],
                fuzziness: 'AUTO'
              }
            });
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
          search = await this.broker.call('es.search', searchQuery);
          max = search.hits.total;
        } else {
          search = await this.broker.call('es.call', {
            api: 'scroll',
            params: { scroll: '30s', scrollId: scrollId }
          });
        }
        const results = fullResult.concat(search.hits.hits);
        if (endTrace > size && max > parseInt(process.env.SCROLL_LIMIT)) {
          max -= parseInt(process.env.SCROLL_LIMIT);
          endTrace -= parseInt(process.env.SCROLL_LIMIT);
          return this.findIP(
            page,
            _size,
            instance,
            lastUpdated,
            keyword,
            results,
            endTrace,
            search._scroll_id,
            max
          );
        }
        return {
          page: results.slice(page * size - size, page * size),
          totalProducts: search.hits.total
        };
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
        const result = await this.broker.call('es.update', {
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
          throw new MoleculerClientError(err.message, 404, sku);
        }
        return new Error(err);
      }
    }
  },

  events: {
    // Subscribe 'list.afterRemote' which will get emit after list action called.
    'list.afterRemote': {
      async handler(payload) {
        if (payload.meta && payload.meta.user) {
          const [instance] = await this.broker.call('klayer.findInstance', {
            consumerKey: payload.meta.user
          });
          if (instance && instance.partner_id) {
            this.updateLastSyncDate(instance.partner_id);
          }
        }
      }
    }
  }
};
