const { MoleculerClientError } = require('moleculer').Errors;
const ESService = require('moleculer-elasticsearch');
const { AgileCRM } = require('../mixins/agilecrm.mixin');
const { ProductTransformation } = require('../mixins/product-transformation.mixin');

module.exports = {
  name: 'products',

  /**
   * Service metadata
   */
  metadata: {},
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
   * Service Mixins
   */
  mixins: [AgileCRM, ProductTransformation, ESService],

  /**
   * Actions
   */
  actions: {
    /**
     * Get product by SKU
     *
     * @returns {Object} Product
     */
    getInstanceProduct: {
      auth: 'Bearer',
      cache: { keys: ['#user', 'sku'], ttl: 60 },
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
    total: {
      auth: 'Bearer',
      handler(ctx) {
        return ctx
          .call('products.count', {
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
      auth: 'Bearer',
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
        hideOutOfStock: { type: 'number', empty: false, convert: true, optional: true },
        keyword: { type: 'string', optional: true },
        currency: { type: 'string', optional: true, min: 3, max: 3 }
      },
      cache: {
        keys: [
          '#user',
          'page',
          'limit',
          'lastupdate',
          'hideOutOfStock',
          'keyword',
          'currency',
          '_source'
        ],
        ttl: 30 * 60, // 10 mins
        monitor: true
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
          ctx.params.hideOutOfStock,
          ctx.params.keyword,
          ctx.params.currency
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
    deleteInstanceProduct: {
      auth: 'Bearer',
      params: {
        sku: { type: 'string' }
      },
      handler(ctx) {
        const { sku } = ctx.params;

        return this.deleteProduct(sku, ctx.meta.user)
          .then(product => {
            this.broker.cacher.clean(`products.list:${ctx.meta.user}**`);
            return { product };
          })
          .catch(error => {
            throw new MoleculerClientError(error);
          });
      }
    },
    import: {
      auth: 'Bearer',
      params: {
        products: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              sku: { type: 'string', convert: true }
            }
          },
          max: 1000,
          min: 1
        }
      },
      handler(ctx) {
        const skus = ctx.params.products.map(i => i.sku);

        return ctx
          .call('products.search', {
            index: 'products',
            type: 'Product',
            size: skus.length + 1,
            body: {
              query: {
                bool: {
                  filter: [{ terms: { _id: skus } }, { term: { archive: false } }]
                }
              }
            }
          })
          .then(async res => {
            const newSKUs = res.hits.hits.map(product => product._id);
            const outOfStock = skus.filter(sku => !newSKUs.includes(sku));
            const [instance] = await this.broker.call('stores.findInstance', {
              consumerKey: ctx.meta.user
            });
            const bulk = [];
            if (newSKUs.length !== 0) {
              res.hits.hits.forEach(product => {
                bulk.push({
                  index: {
                    _index: 'products-instances',
                    _type: 'product',
                    _id: `${instance.consumer_key}-${product._id}`
                  }
                });
                bulk.push({
                  instanceId: instance.consumer_key,
                  createdAt: new Date(),
                  updated: product._source.updated,
                  siteUrl: instance.url,
                  sku: product._id,
                  variations: product._source.variations
                    .filter(variation => variation.quantity > 0)
                    .map(variation => ({ sku: variation.sku }))
                });
              });
            }

            return ctx
              .call('products.bulk', {
                index: 'products-instances',
                type: 'product',
                body: bulk
              })
              .then(response => {
                this.broker.cacher.clean(`products.list:${ctx.meta.user}**`);
                // Update products import quantity
                if (response.items) {
                  const firstImport = response.items
                    .filter(item => item.index._version === 1)
                    .map(item => item.index._id);
                  const update = res.hits.hits.filter(product =>
                    firstImport.includes(`${instance.consumer_key}-${product._id}`)
                  );
                  if (update.length > 0) {
                    ctx.call('products-list.updateQuantityAttributes', {
                      products: update.map(product => ({
                        _id: product._id,
                        qty: product._source.import_qty || 0,
                        attribute: 'import_qty'
                      }))
                    });
                  }
                }

                // Responses
                if (response.errors) {
                  ctx.meta.$statusCode = 500;
                  return {
                    errors: [
                      { message: 'There was an error with importing your products', skus: skus }
                    ]
                  };
                }
                return {
                  success: newSKUs,
                  outOfStock: outOfStock
                };
              });
          });
      }
    },
    instanceUpdate: {
      auth: 'Bearer',
      params: {
        sku: { type: 'string', convert: true },
        externalUrl: { type: 'string', optional: true },
        externalId: { type: 'number', convert: true, optional: true },
        errors: {
          type: 'array',
          optional: true,
          items: { type: 'string' }
        },
        variations: {
          type: 'array',
          optional: true,
          items: {
            type: 'object',
            props: {
              sku: { type: 'string', convert: true, optional: true },
              externalId: { type: 'number', optional: true, convert: true },
              errors: {
                type: 'array',
                optional: true,
                items: { type: 'string' }
              }
            }
          }
        }
      },
      handler(ctx) {
        const body = {};
        if (ctx.params.externalUrl) body.externalUrl = ctx.params.externalUrl;
        if (ctx.params.externalId) body.externalId = ctx.params.externalId;
        if (ctx.params.variations) body.variations = ctx.params.variations;
        if (ctx.params.error) body.error = ctx.params.error;
        return ctx
          .call('products.update', {
            index: 'products-instances',
            type: 'product',
            id: `${ctx.meta.user}-${ctx.params.sku}`,
            body: { doc: body }
          })
          .then(() => 'Updated Successfully!')
          .catch(err => {
            throw new MoleculerClientError(err.message, 500, err.type, ctx.params);
          });
      }
    },
    bulkProductInstance: {
      auth: 'Bearer',
      params: {
        productInstances: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              sku: { type: 'string', convert: true },
              externalUrl: { type: 'string', optional: true },
              externalId: { type: 'string', convert: true, optional: true },
              error: {
                type: 'array',
                optional: true,
                items: { type: 'string' }
              },
              variations: {
                type: 'array',
                optional: true,
                items: {
                  type: 'object',
                  props: {
                    sku: { type: 'string', convert: true, optional: true },
                    externalId: { type: 'string', optional: true, convert: true }
                  }
                }
              }
            }
          }
        }
      },
      handler(ctx) {
        const bulk = [];
        ctx.params.productInstances.forEach(pi => {
          bulk.push({
            update: {
              _index: 'products-instances',
              _type: 'product',
              _id: `${ctx.meta.user}-${pi.sku}`
            }
          });
          delete pi.sku;
          bulk.push({ doc: pi });
        });
        return bulk.length === 0
          ? []
          : this.broker
              .call('products.bulk', {
                body: bulk
              })
              .then(res => {
                if (res.errors === false) return { status: 'success' };
                throw new MoleculerClientError('Error', 500, 'Update Error');
              })
              .catch(() => {
                throw new MoleculerClientError('Error', 500);
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
      const [instance] = await this.broker.call('stores.findInstance', { consumerKey: id });
      try {
        const result = await this.broker
          .call('products.search', {
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
              ? this.broker.call('products.search', {
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
        const [currencyRate] = await this.broker.call('currencies.getCurrency', {
          currencyCode: instance.currency
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
          variations: this.formatVariations(
            source.variations,
            instance,
            currencyRate.rate,
            source.archive
          )
        };
      } catch (err) {
        throw new MoleculerClientError(err.message, 404, sku);
      }
    },

    /**
     * Get products by instance
     *
     * @param {number} page
     * @param {number} size
     * @param {string} instanceId
     * @param {array} _source
     * @param {string} [lastupdate='']
     * @param {string} keyword
     * @returns {Array} Products
     * @memberof ElasticLib
     */
    async findProducts(
      page,
      size = 10,
      instanceId,
      _source,
      lastupdate = '',
      hideOutOfStock,
      keyword,
      currency
    ) {
      const [instance] = await this.broker.call('stores.findInstance', {
        consumerKey: instanceId,
        lastUpdated: lastupdate
      });
      const instanceProductsFull = await this.findIP(
        page,
        size,
        instanceId,
        lastupdate,
        hideOutOfStock,
        keyword
      );

      const instanceProducts = instanceProductsFull.page.map(product => product._source.sku);
      if (instanceProducts.length === 0) {
        return {
          products: [],
          total: instanceProductsFull.totalProducts
        };
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

        const [currencyRate] = await this.broker.call('currencies.getCurrency', {
          currencyCode: currency || instance.currency
        });
        try {
          const products = results.map((product, n) => {
            if (product.found) {
              const source = product._source;
              const p = {
                sku: source.sku,
                name: this.formatI18nText(source.name),
                description: this.formatI18nText(source.description),
                supplier: source.seller_id,
                images: source.images,
                last_check_date: source.last_check_date,
                categories: this.formatCategories(source.categories),
                attributes: this.formatAttributes(source.attributes || []),
                variations: this.formatVariations(
                  source.variations,
                  instance,
                  currencyRate.rate,
                  source.archive,
                  instanceProductsFull.page[n]._source.variations
                )
              };
              try {
                if (typeof instanceProductsFull.page[n]._source.externalId !== 'undefined')
                  p.externalId = instanceProductsFull.page[n]._source.externalId;
                if (typeof instanceProductsFull._source.page[n].externalUrl !== 'undefined')
                  p.externalUrl = instanceProductsFull.page[n]._source.externalUrl;
              } catch (err) {
                this.logger.info('No externalID or externalURL');
              }
              return p;
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
          return new MoleculerClientError(err);
        }
      } catch (err) {
        return new MoleculerClientError(err);
      }
    },

    /**
     * Get Products-Instances by Instance Hash
     *
     * @param {number} [page=1]
     * @param {number} [size=10]
     * @param {object} instance
     * @param {string} [lastUpdated='']
     * @param {string} keyword
     * @param {array} [fullResult=[]] Array of products last recursive call
     * @param {number} [endTrace=0]  to trace the end product needed and stop scrolling after reaching it
     * @param {boolean} [scrollId=false] sending the scroll id on the callback
     * @param {number} [maxScroll=0] just tracking to total products number to the scroll limit to stop if no more products
     * @returns {array} Instance Products
     */
    async findIP(
      page = 1,
      size = 10,
      instanceId,
      lastUpdated = '',
      hideOutOfStock,
      keyword,
      fullResult = [],
      endTrace = 0,
      scrollId = false,
      maxScroll = 0
    ) {
      page = parseInt(page) || 1;
      let search = [];
      const mustNot =
        parseInt(hideOutOfStock) === 1
          ? [{ term: { deleted: true } }, { term: { archive: true } }]
          : [{ term: { deleted: true } }];
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
                  must_not: mustNot,
                  must: [{ term: { 'instanceId.keyword': instanceId } }]
                }
              }
            }
          };

          if (keyword && keyword !== '') {
            searchQuery.body.query.bool.must.push({
              multi_match: {
                query: keyword,
                fields: ['sku.keyword', 'variations.sku.keyword'],
                fuzziness: 'AUTO'
              }
            });
          }

          // Get new an updated products only
          if (lastUpdated && lastUpdated !== '') {
            const lastUpdatedDate = new Date(Number(lastUpdated) * 1000).toISOString();
            searchQuery.body.query.bool.should = [
              {
                range: {
                  updated: {
                    gte: lastUpdatedDate
                  }
                }
              },
              {
                range: {
                  createdAt: {
                    gte: lastUpdatedDate
                  }
                }
              }
            ];
            searchQuery.body.query.bool.minimum_should_match = 1;
          }

          if (page * size <= 10000) {
            this.logger.info('NO NEED FOR SCROLL YA M3LM');
            searchQuery.from = (page - 1) * size;
            searchQuery.size = size;
            delete searchQuery.scroll;
            this.logger.info(searchQuery);
          } else {
            endTrace = page * size;
          }

          search = await this.broker.call('products.search', searchQuery);

          maxScroll = search.hits.total;
        } else {
          search = await this.broker.call('products.call', {
            api: 'scroll',
            params: { scroll: '30s', scrollId: scrollId }
          });
        }

        const results = fullResult.concat(search.hits.hits);

        if (endTrace > size && maxScroll > parseInt(process.env.SCROLL_LIMIT)) {
          maxScroll -= parseInt(process.env.SCROLL_LIMIT);
          endTrace -= parseInt(process.env.SCROLL_LIMIT);

          return this.findIP(
            page,
            size,
            instanceId,
            lastUpdated,
            hideOutOfStock,
            keyword,
            results,
            endTrace,
            search._scroll_id,
            maxScroll
          );
        }

        return {
          page: scrollId ? results.slice(page * size - size, page * size) : results,
          totalProducts: search.hits.total
        };
      } catch (err) {
        return new MoleculerClientError(err);
      }
    },

    /**
     * Delete Product By SKU
     *
     * @param SKU
     * @param id Instance ID
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
          const [instance] = await this.broker.call('stores.findInstance', {
            consumerKey: payload.meta.user
          });
          const [myUser] = instance.users.filter(user => user.roles.includes('owner'));
          if (instance && myUser) {
            this.updateLastSyncDate(myUser.email);
          }
        }
      }
    }
  }
};
