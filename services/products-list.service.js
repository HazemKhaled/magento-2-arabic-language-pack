// const { MoleculerClientError } = require('moleculer').Errors;

module.exports = {
  name: 'products-list',
  actions: {
    searchByFilters: {
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
        gte: { type: 'number', convert: true, integer: true, min: 1, max: 500, optional: true },
        lte: { type: 'number', convert: true, integer: true, min: 0, max: 499, optional: true },
        keyword: { type: 'string', optional: true },
        categoryId: {
          type: 'number',
          convert: true,
          integer: true,
          min: -1,
          max: 500,
          optional: true
        },
        sortBy: { type: 'string', optional: true }
      },
      handler(ctx) {
        const filter = [];
        filter.push({
          term: { archive: false }
        });
        if (ctx.params.gte && ctx.params.lte) {
          filter.push({
            nested: {
              path: 'variations',
              query: {
                range: {
                  'variations.sale': {
                    gte: ctx.params.gte,
                    lte: ctx.params.lte,
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
        return this.searchCall(body, ctx.params.limit, ctx.params.page);
      }
    }
  },
  methods: {
    async searchCall(
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
        return this.searchCall(body, limit, page, fullResult, result._scroll_id, trace, maxScroll);
      }
      return {
        products: fullResult.slice(page * limit - limit, page * limit),
        total: result.hits.total
      };
    }
  }
};
