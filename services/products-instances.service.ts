import { Product } from './../utilities/types/product.type';
import { Context } from 'moleculer';
import { ProductsInstancesMixin } from '../utilities/mixins';

const ESService = require('moleculer-elasticsearch');
const { ProductsInstancesOpenapi, ProductsInstancesValidation, ProductTransformation } = require('../utilities/mixins');
const { MpError } = require('../utilities/adapters');

module.exports = {
  name: 'products-instances',
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
  mixins: [ESService, ProductTransformation, ProductsInstancesMixin, ProductsInstancesOpenapi, ProductsInstancesValidation],
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
        ttl: 60 * 60,
      },
      handler(ctx: Context) {
        return this.fetchProduct(ctx);
      },
    },

    /**
     * Get User total Products Number
     *
     * @return {Number}
     */
    total: {
      auth: 'Bearer',
      cache: {
        keys: ['#user'],
        ttl: 60 * 60,
      },
      handler(ctx: Context) {
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
          .then((res: any) => {
            if (typeof res.count !== 'number') {
              throw new MpError('Products Instance', 'Something went wrong!', 500);
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
        ttl: 60 * 60,
        monitor: true,
      },
      async handler(ctx: Context) {
        const products = await this.findProducts(ctx);

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
      handler(ctx: Context) {
        const { sku } = ctx.params;

        return this.deleteProduct(sku, ctx.meta.user)
          .then((product: Product) => {
            this.broker.cacher.clean(`products-instances.list:${ctx.meta.user}**`);

            return { product };
          })
          .catch(() => {
            throw new MpError('Products Instance', 'Something went wrong!', 500);
          });
      },
    },

    /**
     * Import products by SKU
     *
     * @returns {Object} object
     */
    import: {
      auth: 'Bearer',
      handler(ctx: Context) {
        const skus = ctx.params.products.map((i: { sku: string }) => i.sku);
        return ctx.call('products.getProductsBySku', {
          skus,
        }).then(async res => {
          const newSKUs = res.map((product: Product) => product.sku);
          const outOfStock = skus.filter((sku: string) => !newSKUs.includes(sku));
          const instance = await this.broker.call('stores.findInstance', {
            consumerKey: ctx.meta.user,
          });
          const bulk: any[] = [];
          if(newSKUs.length === 0) {
            throw new MpError('Products Instance', 'Product not found!', 404);
          }
          res.forEach((product: Product) => {
            bulk.push({
              index: {
                _index: 'products-instances',
                _id: `${instance.consumer_key}-${product.sku}`,
              },
            });
            bulk.push({
              instanceId: instance.consumer_key,
              createdAt: new Date(),
              siteUrl: instance.url,
              sku: product.sku,
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
              // Update products import quantity
              if (response.items) {
                const firstImport = response.items
                  .filter((item: any) => item.index._version === 1)
                  .map((item: any) => item.index._id);
                const update = res.filter((product: Product) =>
                  firstImport.includes(`${instance.consumer_key}-${product.sku}`),
                );
                if (update.length > 0) {
                  const updateArr = update.map((product: Product) => {
                    product.imported = (product.imported || []).concat([instance.url]);
                    return {
                      id: product.sku,
                      qty: product.import_qty || 0,
                      attribute: 'import_qty',
                      imported: product.imported,
                    };
                  });
                  new Promise(async (resolve) => {
                    for (let i = 0; i < updateArr.length; i+=100) {
                      await ctx.call('products-list.updateQuantityAttributes', {
                        products: updateArr.slice(i, i+100),
                      });
                    }
                    this.broker.cacher.clean(`products-instances.list:${ctx.meta.user}**`);
                    this.broker.cacher.clean(`products-instances.total:${ctx.meta.user}**`);
                    return resolve();
                  });
                }
              }

              // Responses
              if (response.errors) {
                throw new MpError('Products Instance', 'There was an error with importing your products!', 500);
              }
              return {
                success: newSKUs,
                outOfStock: outOfStock,
              };
            });
        });
      },
    },

    /**
     * update product instance
     *
     * @returns {Object} Product
     */
    instanceUpdate: {
      auth: 'Bearer',
      handler(ctx: Context) {
        const body: { [key: string]: any } = {};
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
            if (res.result === 'updated' || res.result === 'noop') {
              this.broker.cacher.clean(`products-instances.list:${ctx.meta.user}**`);
              return {
                status: 'success',
                message: 'Updated successfully!',
                sku: ctx.params.sku,
              };
            }
            throw new MpError('Products Instance', 'Something went wrong!', 500);
          }, (err: any) => {
            if (err.message.includes('document_missing_exception')) {
              throw new MpError('Products Instance', 'Not Found!', 404);
            }
            throw new MpError('Products Instance', 'Something went wrong!', 500);
          });
      },
    },

    /**
     * Bulk products update
     *
     * @returns {Object} Product
     */
    bulkProductInstance: {
      auth: 'Bearer',
      handler(ctx: Context) {
        const bulk: any[] = [];
        ctx.params.productInstances.forEach((pi: any) => {
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
            .then((res: any) => {
              if (res.errors === false) {
                return {
                  status: 'success',
                };
              }
              throw new MpError('Products Instance', 'Something went wrong!', 500);
            });
      },
    },
  },
};
