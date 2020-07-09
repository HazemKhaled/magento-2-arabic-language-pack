import { Product, Variation } from '../types';
import { ServiceSchema } from 'moleculer';
const { MpError } = require('../adapters');

export const ProductsInstancesMixin: ServiceSchema = {
  name: 'products-instances',
  retryPolicy: {
    retries: 1,
  },
  methods: {
    /**
     * Get Product By SKU
     *
     * @param {Object} instance
     * @returns {Object} Product
     * @memberof Products-instances Mixin
     */
    async fetchProduct(ctx) {
      const { sku, currency, _source } = ctx.params;
      const { store: instance } = ctx.meta;

      const hasProductInstance = await this.checkProductInstance(sku, instance.consumer_key, _source);


      if (!hasProductInstance) {
        throw new MpError('Products Instance Service', `Product not found ${sku}, "store: ${instance.url}" (fetchBySku)!`, 404);
      }

      const product = await this.broker.call('products.getBySku', { sku });

      if (!product) {
        console.error(product);
        throw new MpError('Products Instance', 'Something went wrong!', 500);
      }

      return this.productInstanceSanitizer(product, instance, currency);
    },
    checkProductInstance(sku, instanceKey, _source) {
      return this.broker
        .call('products.search', {
          index: 'products-instances',
          _source: ['sku'],
          body: {
            query: {
              bool: {
                filter: {
                  term: {
                    _id: `${instanceKey}-${sku}`,
                  },
                },
              },
            },
          },
        }).then((res: any) => res.hits.total?.value > 0);
    },
    async productInstanceSanitizer(product, instance, currency) {
      const currencyRate = await this.broker.call('currencies.getCurrency', {
        currencyCode: currency || instance.currency,
      });

      const iProduct = {
        ...product,
        variations: this.formatVariations(
          product.variations,
          instance,
          currencyRate.rate,
          product.archive,
        ),
      };

      return { product: iProduct };
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
     * @memberof Products-instances Mixin
     */
    async findProducts(ctx) {
      const {
        page,
        limit: size = 10,
        lastUpdated = 0,
        hideOutOfStock,
        keyword,
        externalId,
        hasExternalId,
        currency,
      } = ctx.params;

      const { store: instance } = ctx.meta;

      const instanceProductsFull = await this.findIP({
        page,
        size,
        instanceId: instance.consumer_key,
        lastUpdated,
        hideOutOfStock,
        keyword,
        externalId,
        hasExternalId,
      });

      const instanceProducts = instanceProductsFull.page ? instanceProductsFull.page.map((product: { _id: string, _source: Product }) => product._source.sku) : [];
      if (instanceProducts.length === 0) {
        return {
          products: [],
          total: instanceProductsFull.totalProducts,
        };
      }

      try {
        const results = await this.broker.call('products.getProductsBySku', {skus: instanceProducts});
        const currencyRate = await this.broker.call('currencies.getCurrency', {
          currencyCode: currency || instance.currency,
        });

        const products = instanceProductsFull.page.map((pi: {_source: Partial<Product>}) => {
          const product = results.find((p: Product) => String(p.sku) === String(pi._source.sku));
          if (product) {
            return {
              sku: product.sku,
              name: this.formatI18nText(product.name),
              description: this.formatI18nText(product.description),
              supplier: product.seller_id,
              images: product.images,
              updated: pi._source.updated,
              created: pi._source.createdAt,
              categories: this.formatCategories(product.categories),
              attributes: this.formatAttributes(product.attributes || []),
              variations: this.formatVariations(
                product.variations,
                instance,
                currencyRate.rate,
                product.archive,
                pi._source.variations,
              ),
              externalId: pi._source.externalId,
              externalUrl: pi._source.externalUrl,
            };
          }

          // In case product not found at products instance
          const blankProduct: Partial<Product> = {
            sku: pi._source.sku,
            images: [],
            categories: [],
            externalId: pi._source.externalId,
            externalUrl: pi._source.externalUrl,
          };
          blankProduct.variations = pi._source.variations.map((variation: Variation) => {
            variation.quantity = 0;
            return variation;
          });
          return blankProduct;
        });

        return {
          products: products.filter((product: Product) => product),
          total: instanceProductsFull.totalProducts,
        };

      } catch (err) {
        throw new MpError('Products Service', err && err.message || 'Internal server error!', 500);
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
      const mustNot: { [key: string]: any } = [{term: { deleted: true }}];

      if (!scrollId) {
        const searchQuery: {[key: string]: any} = {
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
        if (keyword) {
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
          ];
          searchQuery.body.query.bool.minimum_should_match = 1;
        }

        // Hide out of stock
        if (hideOutOfStock) {
          searchQuery.body.query.bool.must_not.push({
            term: {
              archive: Number(hideOutOfStock) === 1,
            },
          });
        }

        // Add filter if the product has external ID or not
        if (hasExternalId) {
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

        search = await this.broker.call('products-instances.search', searchQuery);

        maxScroll = search.hits.total.value;
      } else {
        search = await this.broker.call('products-instances.call', {
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
    },

    /**
     * Delete Product By SKU
     *
     * @param SKU
     * @param id Instance ID
     * @returns {Object} Status of delete product
     * @memberof Products-instances Mixin
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
        .then((response: any) => {
          if (response._shards.successful > 0)
            return {
              status: 'success',
              message: 'Product has been deleted.',
              sku: sku,
            };
          throw new MpError('Products Instance', `Product not found ${sku} store ${id} (Delete Product)!`, 404);
        })
        .catch((err: unknown) => {
          throw new MpError('Products Instance', err.toString(), 500);
        });
    },
  },
};
