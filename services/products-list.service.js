const ESService = require('moleculer-elasticsearch');
const { MoleculerClientError } = require('moleculer').Errors;

const Transformation = require('../mixins/transformation.mixin');

module.exports = {
  name: 'products-list',
  mixins: [Transformation, ESService],
  settings: {
    elasticsearch: {
      host: `http://${process.env.ELASTIC_AUTH}@${process.env.ELASTIC_HOST}:${
        process.env.ELASTIC_PORT
      }`
    }
  },
  actions: {
    getAttributes: {
      auth: 'Basic',
      params: {},
      handler(ctx) {
        ctx.call('products-list.search', {});
      }
    },
    list: {
      auth: 'Basic',
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
          empty: false,
          optional: true
        },
        price_from: {
          type: 'number',
          convert: true,
          integer: true,
          empty: false,
          optional: true
        },
        keywordLang: { type: 'array', optional: true, items: { type: 'string', min: 2, max: 2 } },
        keyword: { type: 'string', optional: true },
        category_id: {
          type: 'number',
          convert: true,
          integer: true,
          min: -1,
          optional: true
        },
        sortBy: { type: 'string', optional: true },
        images: {
          type: 'number',
          optional: true,
          integer: true,
          max: 15,
          min: 0,
          empty: false,
          convert: true
        }
      },
      cache: {
        keys: [
          'page',
          'limit',
          'price_to',
          'price_from',
          'keyword',
          'keywordLang',
          'category_id',
          'sortBy',
          'images'
        ],
        ttl: 30 * 60 // 10 mins
      },
      handler(ctx) {
        const filter = [];
        filter.push({
          term: { archive: false }
        });
        if (ctx.params.price_from || ctx.params.price_to) {
          filter.push({
            nested: {
              path: 'variations',
              query: {
                range: {
                  'variations.sale': {
                    gte: ctx.params.price_from ? ctx.params.price_from : 0,
                    lte: ctx.params.price_to ? ctx.params.price_to : 1000000,
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
                ...(ctx.params.keywordLang ? ctx.params.keywordLang : ['tr', 'en', 'ar', 'fr']).map(
                  l => `name.${l}.text`
                ),
                ...(ctx.params.keywordLang ? ctx.params.keywordLang : ['tr', 'en', 'ar', 'fr']).map(
                  l => `description.${l}.text`
                ),
                'sku',
                'variations.sku'
              ],
              // To get the result even if misspelled
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
        if (ctx.params.images) {
          filter.push({
            script: {
              script: {
                source: `doc['images'].values.size() > ${parseInt(ctx.params.images)};`
              }
            }
          });
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
    get: {
      auth: 'Basic',
      handler() {
        throw new MoleculerClientError('Not Implemented Yet!!');
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
        result = await this.broker.call('products-list.call', {
          api: 'scroll',
          params: { scroll: '30s', scrollId: scrollId }
        });
      else {
        result = await this.broker.call('products-list.search', {
          index: 'products',
          type: 'Product',
          size: process.env.SCROLL_LIMIT,
          scroll: '1m',
          body: body
        });
        maxScroll = result.hits.total;
        trace = page * limit;
      }
      fullResult =
        trace - parseInt(process.env.SCROLL_LIMIT) <= 0 ? fullResult.concat(result.hits.hits) : [];
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
      const [instance] = await this.broker.call('stores.findInstance', { consumerKey: user });
      const rate = await this.broker.call('klayer.currencyRate', {
        currencyCode: instance.currency
      });

      return {
        products: fullResult
          .slice(
            scrollId ? -limit + trace + parseInt(process.env.SCROLL_LIMIT) : -limit + trace,
            scrollId ? trace + parseInt(process.env.SCROLL_LIMIT) : trace
          )
          .map(product => ({
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
