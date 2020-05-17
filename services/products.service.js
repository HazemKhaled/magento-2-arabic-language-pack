const { MoleculerClientError } = require('moleculer').Errors;
const ESService = require('moleculer-elasticsearch');
const { ProductsOpenapi, ProductsValidation, ProductTransformation, AppSearch } = require('../utilities/mixins');

module.exports = {
  name: 'products',

  /**
   * Service settings
   */
  settings: {
    elasticsearch: {
      host: process.env.ELASTIC_URL,
      httpAuth: process.env.ELASTIC_AUTH,
      apiVersion: process.env.ELASTIC_VERSION || '6.x',
    },
  },
  /**
   * Service Mixins
   */
  mixins: [ProductTransformation, ESService, ProductsValidation, ProductsOpenapi, AppSearch('catalog')],

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
      cache: {
        keys: ['#user', 'sku', 'currency'],
        ttl: 60,
      },
      async handler(ctx) {
        const { sku } = ctx.params;
        const { currency } = ctx.params;
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
          'variations',
        ];
        // _source contains specific to be returned
        if (Array.isArray(_source)) {
          _source = _source.map(field => (fields.includes(field) ? field : null));
        } else {
          _source = fields.includes(_source) ? _source : null;
        }
        const product = await this.fetchProduct(sku, ctx.meta.user, _source, currency);
        if (product === 404) {
          ctx.meta.$statusCode = 404;
          ctx.meta.$statusMessage = 'Not Found';
          return {
            errors: [
              {
                message: 'Product not found!',
              },
            ],
          };
        }
        if (product === 500) {
          ctx.meta.$statusCode = 500;
          ctx.meta.$statusMessage = 'Internal Error';
          return {
            errors: [
              {
                message: 'Internal server error!',
              },
            ],
          };
        }
        return {
          product,
        };
      },
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
            index: 'products-instances',
            body: {
              query: {
                bool: {
                  filter: [
                    {
                      term: {
                        'instanceId.keyword': ctx.meta.user,
                      },
                    },
                  ],
                  must_not: [
                    {
                      term: {
                        deleted: true,
                      },
                    },
                    {
                      term: {
                        archive: true,
                      },
                    },
                  ],
                },
              },
            },
          })
          .then(res => {
            if (typeof res.count !== 'number') {
              ctx.meta.$statusCode = 500;
              ctx.meta.$statusMessage = 'Internal Server Error';
              return {
                errors: [
                  {
                    message: 'Something went wrong!',
                  },
                ],
              };
            }
            return {
              total: res.count,
            };
          });
      },
    },

    /**
     * Get Products By Page
     *
     * @returns {Array} 10 - 1000 products per page
     */
    list: {
      auth: 'Bearer',
      cache: {
        keys: [
          '#user',
          'page',
          'limit',
          'lastupdate',
          'hideOutOfStock',
          'keyword',
          'externalId',
          'hasExternalId',
          'currency',
          '_source',
        ],
        ttl: 30 * 60, // 10 mins
        monitor: true,
      },
      async handler(ctx) {
        const { page, limit, lastupdate: lastUpdated = 0, hideOutOfStock, keyword, externalId, currency, hasExternalId } = ctx.params;

        const products = await this.findProducts({
          page,
          size: limit,
          instanceId: ctx.meta.user,
          lastUpdated: Number(lastUpdated),
          hideOutOfStock,
          keyword,
          externalId,
          currency,
          hasExternalId,
        });

        // Emit async Event
        ctx.emit('list.afterRemote', ctx);
        return products;
      },
    },

    /**
     * Delete product by SKU
     *
     * @returns {Object} Product
     */
    deleteInstanceProduct: {
      auth: 'Bearer',
      handler(ctx) {
        const { sku } = ctx.params;

        return this.deleteProduct(sku, ctx.meta.user)
          .then(product => {
            this.broker.cacher.clean(`products.list:${ctx.meta.user}**`);
            if (product === 404) {
              ctx.meta.$statusCode = 404;
              ctx.meta.$statusMessage = 'Not Found';
              return {
                errors: [
                  {
                    message: 'Product not found!',
                  },
                ],
              };
            }
            if (product === 500) {
              ctx.meta.$statusCode = 500;
              ctx.meta.$statusMessage = 'Internal Error';
              return {
                errors: [
                  {
                    message: 'Internal Server Error!',
                  },
                ],
              };
            }
            return {
              product,
            };
          })
          .catch(() => {
            ctx.meta.$statusCode = 500;
            ctx.meta.$statusMessage = 'Internal Server Error';
            return {
              errors: [
                {
                  message: 'Something went wrong!',
                },
              ],
            };
          });
      },
    },
    'import': {
      auth: 'Bearer',
      handler(ctx) {
        const skus = ctx.params.products.map(i => i.sku);
        return this.documentsSearch('cat', {
          filters: {
            all: [
              {
                sku: skus,
              },
              {
                archive: 'false',
              },
            ],
          },
          page: {
            size: 100,
          },
        })
          .then(async res => {
            const newSKUs = res.results.map(product => product.id);
            const outOfStock = skus.filter(sku => !newSKUs.includes(sku));
            const instance = await this.broker.call('stores.findInstance', {
              consumerKey: ctx.meta.user,
            });
            const bulk = [];
            if(newSKUs.length === 0) {
              ctx.meta.$statusCode = 404;
              ctx.meta.$statusMessage = 'Not Found!';
              return {message: 'Product not found'};
            }
            res.results.forEach(product => {
              bulk.push({
                index: {
                  _index: 'products-instances',
                  _id: `${instance.consumer_key}-${product.id}`,
                },
              });
              bulk.push({
                instanceId: instance.consumer_key,
                createdAt: new Date(),
                siteUrl: instance.url,
                sku: product.id,
                variations: product.variations
                  .filter(variation => variation.quantity > 0)
                  .map(variation => ({
                    sku: variation.sku,
                  })),
              });
            });

            return ctx
              .call('products.bulk', {
                index: 'products-instances',
                body: bulk,
              })
              .then(response => {
                this.broker.cacher.clean(`products.list:${ctx.meta.user}**`);
                // Update products import quantity
                if (response.items) {
                  const firstImport = response.items
                    .filter(item => item.index._version === 1)
                    .map(item => item.index._id);
                  const update = res.results.filter(product =>
                    firstImport.includes(`${instance.consumer_key}-${product.id}`),
                  );
                  if (update.length > 0) {
                    ctx.call('products-list.updateQuantityAttributes', {
                      products: update.map(product => {
                        product.imported = (product.imported || []).concat([instance.url]);
                        return {
                          id: product.id,
                          qty: product.import_qty || 0,
                          attribute: 'import_qty',
                          imported: product.imported,
                        };
                      }),
                    });
                  }
                }

                // Responses
                if (response.errors) {
                  ctx.meta.$statusCode = 500;
                  ctx.meta.$statusMessage = 'Internal Server Error';
                  return {
                    errors: [
                      {
                        message: 'There was an error with importing your products',
                        skus: skus,
                      },
                    ],
                  };
                }
                return {
                  success: newSKUs,
                  outOfStock: outOfStock,
                };
              });
          });
      },
    },
    instanceUpdate: {
      auth: 'Bearer',
      handler(ctx) {
        const body = {};
        if (ctx.params.externalUrl) body.externalUrl = ctx.params.externalUrl;
        if (ctx.params.externalId) body.externalId = ctx.params.externalId;
        if (ctx.params.variations) body.variations = ctx.params.variations;
        if (ctx.params.error) body.error = ctx.params.error;
        return ctx
          .call('products.update', {
            index: 'products-instances',
            type: '_doc',
            id: `${ctx.meta.user}-${ctx.params.sku}`,
            body: {
              doc: body,
            },
          })
          .then(res => {
            if (res.result === 'updated' || res.result === 'noop')
              return {
                status: 'success',
                message: 'Updated successfully!',
                sku: ctx.params.sku,
              };
            ctx.meta.$statusCode = 500;
            ctx.meta.$statusMessage = 'Internal Server Error';
            return {
              errors: [
                {
                  message: 'Something went wrong!',
                },
              ],
            };
          })
          .catch(err => {
            if (err.message.includes('document_missing_exception')) {
              ctx.meta.$statusCode = 404;
              ctx.meta.$statusMessage = 'Not Found';
              return {
                errors: [
                  {
                    message: 'Not Found!',
                  },
                ],
              };
            }
            ctx.meta.$statusCode = 500;
            ctx.meta.$statusMessage = 'Internal Server Error';
            return {
              errors: [
                {
                  message: 'Something went wrong!',
                },
              ],
            };
          });
      },
    },
    bulkProductInstance: {
      auth: 'Bearer',
      handler(ctx) {
        const bulk = [];
        ctx.params.productInstances.forEach(pi => {
          bulk.push({
            update: {
              _index: 'products-instances',
              _id: `${ctx.meta.user}-${pi.sku}`,
            },
          });
          delete pi.sku;
          bulk.push({
            doc: pi,
          });
        });
        return bulk.length === 0
          ? []
          : this.broker
            .call('products.bulk', {
              index: 'products-instances',
              type: '_doc',
              body: bulk,
            })
            .then(res => {
              if (res.errors === false) {
                return {
                  status: 'success',
                };
              }
              ctx.meta.$statusCode = 500;
              ctx.meta.$statusMessage = 'Internal Server Error';
              return {
                errors: [
                  {
                    message: 'Update Error!',
                  },
                ],
              };
            })
            .catch(() => {
              ctx.meta.$statusCode = 500;
              ctx.meta.$statusMessage = 'Internal Server Error';
              return {
                errors: [
                  {
                    message: 'Something went wrong!',
                  },
                ],
              };
            });
      },
    },
  },
  methods: {
    /**
     * Get Product By SKU
     *
     * @param {Object} instance
     * @returns {Object} Product
     * @memberof ElasticLib
     */
    async fetchProduct(sku, id, _source, currency) {
      const instance = await this.broker.call('stores.findInstance', {
        consumerKey: id,
      });
      try {
        const result = await this.broker
          .call('products.search', {
            index: 'products-instances',
            _source: _source,
            body: {
              query: {
                bool: {
                  filter: {
                    term: {
                      'sku.keyword': sku,
                    },
                  },
                },
              },
            },
          })
          .then(res =>
            res.hits.total.value > 0
              ? this.getDocumentsByIds([sku])
              : res.hits.hits,
          );
        if (!result.length) {
          return 404;
        }
        const currencyRate = await this.broker.call('currencies.getCurrency', {
          currencyCode: currency || instance.currency,
        });
        const source = result[0];
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
            source.archive,
          ),
        };
      } catch (err) {
        console.log(err);
        return 500;
      }
    },

    /**
     * Get products by instance
     *
     * @param {number} page
     * @param {number} size
     * @param {string} instanceId
     * @param {array} _source
     * @param {string} [lastUpdated=0]
     * @param {string} keyword
     * @returns {Array} Products
     * @memberof ElasticLib
     */
    async findProducts({
      page,
      size = 10,
      instanceId,
      lastUpdated = 0,
      hideOutOfStock,
      keyword,
      externalId,
      hasExternalId,
      currency,
    }) {
      const instance = await this.broker.call('stores.findInstance', { consumerKey: instanceId });

      const instanceProductsFull = await this.findIP({
        page,
        size,
        instanceId,
        lastUpdated,
        hideOutOfStock,
        keyword,
        externalId,
        hasExternalId,
      });

      const instanceProducts = instanceProductsFull.page ? instanceProductsFull.page.map(product => product._source.sku) : [];
      if (instanceProducts.length === 0) {
        return {
          products: [],
          total: instanceProductsFull.totalProducts,
        };
      }

      try {
        const results = await this.getDocumentsByIds(instanceProducts);
        const currencyRate = await this.broker.call('currencies.getCurrency', {
          currencyCode: currency || instance.currency,
        });

        const products = results.map((product, n) => {
          if (product) {
            return {
              sku: product.sku,
              name: this.formatI18nText(product.name),
              description: this.formatI18nText(product.description),
              supplier: product.seller_id,
              images: product.images,
              updated: instanceProductsFull.page[n]._source.updated,
              created: instanceProductsFull.page[n]._source.createdAt,
              last_check_date: product.last_check_date,
              categories: this.formatCategories(product.categories),
              attributes: this.formatAttributes(product.attributes || []),
              variations: this.formatVariations(
                product.variations,
                instance,
                currencyRate.rate,
                product.archive,
                instanceProductsFull.page[n]._source.variations,
              ),
              externalId: instanceProductsFull.page[n]._source.externalId,
              externalUrl: instanceProductsFull.page[n]._source.externalUrl,
            };
          }

          // In case product not found at products instance
          const blankProduct = {
            sku: instanceProductsFull.page[n]._source.sku,
            images: [],
            categories: [],
            externalId: instanceProductsFull.page[n]._source.externalId,
            externalUrl: instanceProductsFull.page[n]._source.externalUrl,
          };
          blankProduct.variations = instanceProductsFull.page[n]._source.variations.map(variation => {
            variation.quantity = 0;
            return variation;
          });
          return blankProduct;
        });

        return {
          products: products.filter(product => !!product && product.variations.length !== 0),
          total: instanceProductsFull.totalProducts,
        };

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
     * @param {string} [lastUpdated=0]
     * @param {string} keyword
     * @param {array} [fullResult=[]] Array of products last recursive call
     * @param {number} [endTrace=0]  to trace the end product needed and stop scrolling after reaching it
     * @param {boolean} [scrollId=false] sending the scroll id on the callback
     * @param {number} [maxScroll=0] just tracking to total products number to the scroll limit to stop if no more products
     * @returns {array} Instance Products
     */
    async findIP({
      page = 1,
      size = 10,
      instanceId,
      lastUpdated = 0,
      hideOutOfStock,
      keyword,
      externalId,
      hasExternalId,
      fullResult = [],
      endTrace = 0,
      scrollId = false,
      maxScroll = 0,
    }) {
      page = parseInt(page) || 1;
      let search = [];
      const mustNot = [{term: { deleted: true }}];

      try {
        if (!scrollId) {
          const searchQuery = {
            index: 'products-instances',
            scroll: '1m',
            size: process.env.SCROLL_LIMIT,
            body: {
              sort: [
                {
                  createdAt: {
                    order: 'asc',
                  },
                },
              ],
              query: {
                bool: {
                  must_not: mustNot,
                  must: [
                    {
                      term: {
                        'instanceId.keyword': instanceId,
                      },
                    },
                  ],
                },
              },
            },
          };

          if (keyword && keyword !== '') {
            searchQuery.body.query.bool.must.push({
              multi_match: {
                query: keyword,
                fields: ['sku.keyword', 'variations.sku.keyword'],
                fuzziness: 'AUTO',
              },
            });
          }

          if (externalId) {
            searchQuery.body.query.bool.must.push({
              term: {
                externalId,
              },
            });
          }

          // Get new an updated products only
          if (lastUpdated) {
            const lastUpdatedDate = new Date(lastUpdated * 1000).toISOString();
            searchQuery.body.query.bool.should = [
              {
                range: {
                  updated: {
                    gte: lastUpdatedDate,
                  },
                },
              },
              {
                range: {
                  createdAt: {
                    gte: lastUpdatedDate,
                  },
                },
              },
            ];
            searchQuery.body.query.bool.minimum_should_match = 1;
          }

          // Hide out of stock
          if (hideOutOfStock && hideOutOfStock !== '') {
            searchQuery.body.query.bool.must_not.push({
              term: {
                archive: Number(hideOutOfStock) === 1,
              },
            });
          }

          // Add filter if the product has external ID or not
          if (hasExternalId && hasExternalId !== '') {
            switch(!!Number(hasExternalId)) {
            case true:
              searchQuery.body.query.bool.must.push({
                exists: {
                  field: 'externalId',
                },
              });
              break;
            case false:
              mustNot.push({
                exists: {
                  field: 'externalId',
                },
              });
            }
          }

          if (page * size <= 10000) {
            this.logger.info('NO NEED FOR SCROLL YA M3LM');
            searchQuery.from = (page - 1) * size;
            searchQuery.size = size;
            delete searchQuery.scroll;
          } else {
            endTrace = page * size;
          }

          search = await this.broker.call('products.search', searchQuery);

          maxScroll = search.hits.total.value;
        } else {
          search = await this.broker.call('products.call', {
            api: 'scroll',
            params: {
              scroll: '30s',
              scrollId: scrollId,
            },
          });
        }

        const results = fullResult.concat(search.hits.hits);
        if (endTrace > size && maxScroll > parseInt(process.env.SCROLL_LIMIT)) {
          maxScroll -= parseInt(process.env.SCROLL_LIMIT);
          endTrace -= parseInt(process.env.SCROLL_LIMIT);

          return this.findIP({
            page,
            size,
            instanceId,
            lastUpdated,
            hideOutOfStock,
            keyword,
            externalId,
            hasExternalId,
            fullResult: results,
            endTrace,
            scrollId: search._scroll_id,
            maxScroll,
          });
        }
        return {
          page: scrollId ? results.slice(page * size - size, page * size) : results,
          totalProducts: search.hits.total.value,
        };
      } catch (err) {
        console.error(err);
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
    deleteProduct(sku, id) {
      return this.broker
        .call('products.update', {
          index: 'products-instances',
          type: '_doc',
          id: `${id}-${sku}`,
          body: {
            doc: {
              deleted: true,
              delete_date: new Date(),
            },
          },
        })
        .then(response => {
          if (response._shards.successful > 0)
            return {
              status: 'success',
              message: 'Product has been deleted.',
              sku: sku,
            };
          return 404;
        })
        .catch(() => {
          return 500;
        });
    },
  },
};
