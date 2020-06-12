import { MpError } from './../utilities/adapters/mpError';
import { Product } from './../utilities/types/product.type';
import { ServiceSchema } from 'moleculer';
const ESService = require('moleculer-elasticsearch');
const { ProductTransformation, I18nService, ProductsOpenapi, ProductsValidation, AppSearch } = require('../utilities/mixins');

const TheService: ServiceSchema = {
  name: 'products',
  retryPolicy: {
    retries: 1,
  },
  mixins: [I18nService, ProductTransformation, ESService, ProductsOpenapi, ProductsValidation, AppSearch],
  settings: {
    elasticsearch: {
      host: process.env.ELASTIC_URL,
      httpAuth: process.env.ELASTIC_AUTH,
      apiVersion: process.env.ELASTIC_VERSION || '7.x',
    },
  },
  actions: {
    list: {
      auth: 'Basic',
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
          'images',
        ],
        ttl: 30 * 60, // 10 mins
      },
      handler(ctx) {
        const filter = [];
        filter.push({
          term: {
            archive: false,
          },
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
                    boost: 2.0,
                  },
                },
              },
            },
          });
        }
        if (ctx.params.keyword) {
          filter.push({
            multi_match: {
              query: ctx.params.keyword,
              fields: [
                ...(ctx.params.keywordLang ? ctx.params.keywordLang : ['tr', 'en', 'ar', 'fr']).map(
                  (l: string) => `name.${l}.text`,
                ),
                ...(ctx.params.keywordLang ? ctx.params.keywordLang : ['tr', 'en', 'ar', 'fr']).map(
                  (l: string) => `description.${l}.text`,
                ),
                'sku',
                'variations.sku',
              ],
              // To get the result even if misspelled
              fuzziness: 'AUTO',
            },
          });
        }
        if (ctx.params.category_id)
          filter.push({
            term: {
              'categories.id': parseInt(ctx.params.category_id),
            },
          });
        const sort: { [key: string]: any } = {};
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
            nested_path: 'variations',
          };
          break;
        case 'priceDesc':
          sort['variations.sale'] = {
            order: 'desc',
            nested_path: 'variations',
          };
          break;
        default:
          break;
        }

        if (ctx.params.images) {
          filter.push({
            script: {
              script: {
                source: `doc['images'].values.size() > ${parseInt(ctx.params.images)};`,
              },
            },
          });
        }

        const body = {
          sort: sort,
          query: {
            bool: {
              filter,
            },
          },
        };
        return this.searchCall(ctx.meta.user, body, ctx.params.limit, ctx.params.page);
      },
    },
    getBySku: {
      auth: 'Basic',
      cache: {
        keys: ['skus'],
        ttl: 60 * 60 * 5,
      },
      handler(ctx) {
        return ctx.call('products.search', {
          index: 'products',
          type: '_doc',
          body: {
            query: {
              bool: {
                filter: {
                  term: {
                    _id: ctx.params.sku,
                  },
                },
              },
            },
          },
        }).then(({ hits: { hits: [product] } }) => {
          if (!product) {
            throw new MpError('Products Service', 'Product Not Found!', 404);
          }
          return this.productSanitize(product);
        });
      },
    },
    getProductsBySku: {
      auth: 'Basic',
      cache: {
        keys: ['skus'],
        ttl: 60 * 60 * 5,
      },
      handler(ctx) {
        return ctx.call('products.search', {
          index: 'products',
          type: '_doc',
          body: {
            query: {
              bool: {
                filter: [
                  {
                    terms: {
                      sku: ctx.params.skus,
                    },
                  },
                  {
                    term: {
                      archive: false,
                    },
                  },
                ],
              },
            },
          },
        }).then(({ hits: { hits: products } }) => products.map((product: Product) => this.productSanitize(product)));
      },
    },
    getProductsByVariationSku: {
      auth: 'Basic',
      cache: {
        keys: ['skus'],
        ttl: 60 * 60 * 5,
      },
      handler(ctx) {
        return ctx
          .call('products.search', {
            index: 'products',
            size: 1000,
            body: {
              query: {
                nested: {
                  path: 'variations',
                  query: {
                    bool: {
                      filter: {
                        terms: {
                          'variations.sku': ctx.params.skus,
                        },
                      },
                    },
                  },
                },
              },
            },
          })
          .then(response => {
            return { products: response.hits.hits.map(({_source} : {_source: Product}) => _source) };
          });
      },
    },
    updateQuantityAttributes: {
      handler(ctx) {
        const bulk = ctx.params.products.map((product: { id: string; qty: number; attribute: string; imported: string[]; }) => {
          const body: {
            id: string;
            imported?: string[];
            [x: string]: string | number | string[];
          } = {
            id: product.id,
            [product.attribute]: product.qty + 1,
          };
          if (product.imported) body.imported = product.imported;
          return body;
        });
        return this.updateDocuments(bulk);
      },
    },
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
      maxScroll = 0,
    ) {
      limit = limit ? parseInt(limit) : 10;
      page = page ? parseInt(page) : 1;
      let result = [];
      if (scrollId)
        result = await this.broker.call('products.call', {
          api: 'scroll',
          params: {
            scroll: '30s',
            scrollId: scrollId,
          },
        });
      else {
        result = await this.broker.call('products.search', {
          index: 'products',
          size: process.env.SCROLL_LIMIT,
          scroll: '1m',
          body: body,
        });
        maxScroll = result.hits.total.value;
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
          maxScroll,
        );
      }
      const instance = await this.broker.call('stores.findInstance', {
        consumerKey: user,
      });
      const rate = await this.broker.call('currencies.getCurrency', {
        currencyCode: instance.currency,
      });

      return {
        products: fullResult
          .slice(
            scrollId ? -limit + trace + parseInt(process.env.SCROLL_LIMIT) : -limit + trace,
            scrollId ? trace + parseInt(process.env.SCROLL_LIMIT) : trace,
          )
          .map((product: Product) => this.productSanitize(product)),
        total: result.hits.total.value,
      };
    },
    productSanitize(product) {
      return {
        sku: product._source.sku,
        name: this.formatI18nText(product._source.name),
        archive: product._source.archive,
        description: this.formatI18nText(product._source.description),
        supplier: product._source.seller_id,
        images: product._source.images,
        tax_class: product._source.tax_class,
        categories: this.formatCategories(product._source.categories),
        attributes: product._source.attributes,
        variations: product._source.variations,
      };
    },
  },
};

export = TheService;
