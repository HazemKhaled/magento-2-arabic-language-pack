const { MoleculerClientError } = require('moleculer').Errors;
const Transformation = require('../mixins/transformation.mixin');

module.exports = {
  name: 'products-list',
  mixins: [Transformation],
  actions: {
    searchByFilters: {
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
        price_to: {
          type: 'number',
          convert: true,
          integer: true,
          min: 1,
          max: 500,
          optional: true
        },
        price_from: {
          type: 'number',
          convert: true,
          integer: true,
          min: 0,
          max: 499,
          optional: true
        },
        keyword: { type: 'string', optional: true },
        category_id: {
          type: 'number',
          convert: true,
          integer: true,
          min: -1,
          optional: true
        },
        sortBy: { type: 'string', optional: true }
      },
      handler(ctx) {
        const filter = [];
        filter.push({
          term: { archive: false }
        });
        if (ctx.params.price_from && ctx.params.price_to) {
          filter.push({
            nested: {
              path: 'variations',
              query: {
                range: {
                  'variations.sale': {
                    gte: ctx.params.price_to,
                    lte: ctx.params.price_from,
                    boost: 2.0
                  }
                }
              }
            }
          });
        }
        if (ctx.params.keyword) {
          filter.push({
            multi_match: {
              query: ctx.params.keyword,
              fields: [
                ...['tr', 'en', 'ar'].map(l => `name.${l}.text`),
                ...['tr', 'en', 'ar'].map(l => `description.${l}.text`),
                'sku',
                'variations.sku'
              ],
              // To get the result even if mispeled
              fuzziness: 'AUTO'
            }
          });
        }
        if (ctx.params.category_id)
          filter.push({ term: { 'categories.id': parseInt(ctx.params.category_id) } });
        const sort = {};
        switch (ctx.params.sortBy) {
          case 'salesDesc':
            sort.sales_qty = { order: 'desc' };
            break;
          case 'updated':
            sort.updated = { order: 'desc' };
            break;
          case 'createdAsc':
            sort.created = { order: 'asc' };
            break;
          case 'createdDesc':
            sort.created = { order: 'desc' };
            break;
          case 'priceAsc':
            sort['variations.sale'] = {
              order: 'asc',
              nested_path: 'variations'
            };
            break;
          case 'priceDesc':
            sort['variations.sale'] = {
              order: 'desc',
              nested_path: 'variations'
            };
            break;
          default:
            break;
        }
        const body = {
          sort: sort,
          query: {
            bool: {
              filter: filter
            }
          }
        };
        return this.searchCall(ctx.meta.user, body, ctx.params.limit, ctx.params.page);
      }
    },
    import: {
      auth: 'required',
      params: {
        products: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              sku: { type: 'string' }
            }
          },
          max: 1000,
          min: 1
        }
      },
      handler(ctx) {
        const skus = ctx.params.products.map(i => i.sku);
        return ctx
          .call('es.search', {
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
            const [instance] = await this.broker.call('klayer.findInstance', {
              consumerKey: ctx.meta.user
            });
            const bulk = [];
            if (newSKUs.length !== 0) {
              res.hits.hits.forEach(product => {
                bulk.push({
                  index: {
                    _index: 'products-instances',
                    _type: 'product',
                    _id: `${instance.webhook_hash}-${product._id}`
                  }
                });
                bulk.push({
                  instanceId: instance.webhook_hash,
                  createdAt: new Date(),
                  siteUrl: instance.url,
                  sku: product._id,
                  variations: product._source.variations
                    .filter(variation => variation.quantity > 0)
                    .map(variation => ({ sku: variation.sku }))
                });
              });
            }
            await ctx
              .call('es.bulk', {
                index: 'products-instances',
                type: 'product',
                body: bulk
              })
              .then(() => this.broker.cacher.clean(`products.list:${ctx.meta.token}**`));
            return {
              success: newSKUs,
              outOfStock: outOfStock
            };
          })
          .catch(error => {
            throw new MoleculerClientError(error.message, 500, error.type, ctx.params);
          });
      }
    }
  },
  methods: {
    /* SearchByFilters methods */
    /**
     * @param {String} user
     * @param {Object} body
     */
    async searchCall(
      user,
      body,
      limit,
      page,
      fullResult = [],
      scrollId = false,
      trace = 0,
      maxScroll = 0
    ) {
      limit = limit ? parseInt(limit) : 10;
      page = page ? parseInt(page) : 1;
      let result = [];
      if (scrollId)
        result = await this.broker.call('es.call', {
          api: 'scroll',
          params: { scroll: '30s', scrollId: scrollId }
        });
      else {
        result = await this.broker.call('es.search', {
          index: 'products',
          type: 'Product',
          size: process.env.SCROLL_LIMIT,
          scroll: '1m',
          body: body
        });
        maxScroll = result.hits.total;
        trace = page * limit;
      }
      fullResult = fullResult.concat(result.hits.hits);
      if (trace > limit && maxScroll > parseInt(process.env.SCROLL_LIMIT)) {
        maxScroll -= parseInt(process.env.SCROLL_LIMIT);
        trace -= parseInt(process.env.SCROLL_LIMIT);
        return this.searchCall(
          user,
          body,
          limit,
          page,
          fullResult,
          result._scroll_id,
          trace,
          maxScroll
        );
      }
      const [instance] = await this.broker.call('klayer.findInstance', { consumerKey: user });
      const rate = await this.broker.call('klayer.currencyRate', {
        currencyCode: instance.base_currency
      });

      return {
        products: fullResult.slice(page * limit - limit, page * limit).map(product => ({
          sku: product._source.sku,
          name: this.formatI18nText(product._source.name),
          description: this.formatI18nText(product._source.description),
          supplier: product._source.seller_id,
          images: product._source.images,
          last_check_date: product._source.last_check_date,
          categories: this.formatCategories(product._source.categories),
          attributes: this.formatAttributes(product._source.attributes),
          variations: this.formatVariations(
            product._source.variations,
            instance,
            rate,
            product._source.archive
          )
        })),
        total: result.hits.total
      };
    }
    /* SearchByFilters methods */
  }
};
