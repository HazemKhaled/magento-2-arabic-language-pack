import { Context, GenericObject } from 'moleculer';
import ESService from 'moleculer-elasticsearch';

import {
  ProductsInstancesOpenapi,
  ProductsInstancesValidation,
  ProductTransformation,
  ProductsInstancesMixin,
  AppSearch,
  GCPPubSub,
} from '../utilities/mixins';
import { MpError } from '../utilities/adapters';
import {
  Product,
  Products,
  UpdateProductParams,
  ProductSearchParams,
  ProductTotalParams,
  MetaParams,
  ElasticSearchType,
  CommonError,
  ElasticSearchResponse,
  ElasticQuery,
} from '../utilities/types';

module.exports = {
  name: 'products-instances',
  /**
   * Service settings
   */
  settings: {
    elasticsearch: {
      host: process.env.ELASTIC_URL,
      httpAuth: process.env.ELASTIC_AUTH,
      apiVersion: process.env.ELASTIC_VERSION || '7.x',
    },
  },
  /**
   * Service Mixins
   */
  mixins: [
    ESService,
    GCPPubSub,
    ProductTransformation,
    ProductsInstancesMixin,
    ProductsInstancesOpenapi,
    ProductsInstancesValidation,
    AppSearch(process.env.APP_SEARCH_ENGINE),
  ],
  hooks: {
    after: {
      deleteInstanceProduct: ['deletePublish'],
      import: ['importPublish'],
      instanceUpdate: ['pushPublish'],
      bulkProductInstance: ['pushPublish'],
    },
  },
  actions: {
    /**
     * Get product by SKU
     *
     * @returns {Object} Product
     */
    getInstanceProduct: {
      auth: ['Bearer'],
      cache: {
        keys: ['#user', 'sku', 'currency'],
        ttl: 60 * 60,
      },
      handler(ctx: Context): Promise<Product> {
        return this.fetchProduct(ctx);
      },
    },

    /**
     * Get User total Products Number
     *
     * @return {Number}
     */
    total: {
      auth: ['Bearer'],
      cache: {
        keys: ['#user', 'lastUpdate', 'hideOutOfStock', 'hasExternalId'],
        ttl: 60 * 60,
      },
      handler(
        ctx: Context<ProductTotalParams, MetaParams>
      ): Promise<{ total: number }> {
        const query: ElasticQuery = {
          bool: {
            must: [],
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
            ],
          },
        };
        if (Object.keys(ctx.params).length) {
          if (ctx.params.hideOutOfStock) {
            query.bool.must_not.push({
              term: {
                archive: Number(ctx.params.hideOutOfStock) === 1,
              },
            });
          }
          if (ctx.params.hasExternalId) {
            switch (Boolean(Number(ctx.params.hasExternalId))) {
              case true:
                query.bool.must.push({
                  exists: {
                    field: 'externalId',
                  },
                });
                break;
              case false:
                query.bool.must_not.push({
                  exists: {
                    field: 'externalId',
                  },
                });
            }
          }
          if (ctx.params.lastUpdate) {
            const lastUpdated = ctx.params.lastUpdate;
            query.bool.must.push({
              range: {
                updated: {
                  gte: new Date(Number(lastUpdated)),
                },
              },
            });
          }
        }
        return ctx
          .call<ElasticSearchResponse, Partial<ElasticSearchType>>(
            'products.count',
            {
              index: 'products-instances',
              body: {
                query,
              },
            }
          )
          .then(res => {
            if (typeof res.count !== 'number') {
              throw new MpError(
                'Products Instance',
                'Something went wrong!',
                500
              );
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
      auth: ['Bearer'],
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
          'sort',
        ],
        ttl: 60 * 60,
        monitor: true,
      },
      async handler(
        ctx: Context
      ): Promise<{ products: Product[]; total: number }> {
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
      auth: ['Bearer'],
      async handler(
        ctx: Context<Product, MetaParams>
      ): Promise<Product | unknown> {
        let { sku } = ctx.params;
        const { externalId } = ctx.params;
        if (externalId) {
          try {
            const productSku = await this.getProductSKUByExternalId(
              externalId,
              ctx.meta.user
            );
            sku = productSku;
          } catch (err) {
            ctx.meta.$statusCode = err.code;
            ctx.meta.$statusMessage =
              err.code === 404 ? 'Not Found' : 'Server Error';

            return {
              errors: [
                {
                  status: err.code === 404 ? 'Not Found' : 'Server Error',
                  message: err.message,
                },
              ],
            };
          }
        }
        if (!sku) {
          throw new MpError('Products Instance', 'SKU Required!', 422);
        }

        return this.deleteProduct(sku, ctx.meta.user)
          .then(async (product: Product) => {
            this.broker.cacher.clean(
              `products-instances.list:${ctx.meta.user}**`
            );
            const [appSearchProduct] = await this.getDocumentsByIds([sku]);
            if (appSearchProduct) {
              const index = appSearchProduct.imported?.indexOf(
                ctx.meta.store.url
              );
              if (index >= 0) {
                appSearchProduct.imported.splice(index, 1);
                await ctx.call<Product, Partial<Products>>(
                  'products.updateQuantityAttributes',
                  {
                    products: [
                      {
                        id: product.sku,
                        qty: appSearchProduct.imported.length,
                        attribute: 'import_qty',
                        imported: appSearchProduct.imported,
                      },
                    ],
                  }
                );
              }
            }
            return { product };
          })
          .catch((err: CommonError) => {
            ctx.meta.$statusCode = err.code;
            ctx.meta.$statusMessage =
              err.code === 404 ? 'Not Found' : 'Server Error';
            return {
              errors: [
                {
                  status: err.code === 404 ? 'Not Found' : 'Server Error',
                  message: err.message,
                },
              ],
            };
          });
      },
    },

    /**
     * Import products by SKU
     *
     * @returns {Object} object
     */
    import: {
      auth: ['Bearer'],
      handler(ctx: Context<Products, MetaParams>): Promise<GenericObject> {
        const skus = ctx.params.products.map((i: { sku: string }) => i.sku);
        return ctx
          .call<Product[], Partial<Products>>('products.getProductsBySku', {
            skus,
          })
          .then(async (res: Product[]) => {
            const newSKUs = res.map((product: Product) => product.sku);
            const outOfStock = skus.filter(
              (sku: string) => !newSKUs.includes(sku)
            );

            const { store } = ctx.meta;

            const bulk: GenericObject[] = [];
            if (newSKUs.length === 0) {
              throw new MpError(
                'Products Instance Service',
                `Product not found ${outOfStock.join(',')} (Import)!`,
                404
              );
            }
            res.forEach((product: Product) => {
              bulk.push({
                update: {
                  _index: 'products-instances',
                  _id: `${store.consumer_key}-${product.sku}`,
                },
              });
              bulk.push({
                doc: {
                  instanceId: store.consumer_key,
                  createdAt: new Date(),
                  updated: new Date(),
                  siteUrl: store.url,
                  sku: product.sku,
                  variations: product.variations
                    .filter(variation => variation.quantity > 0)
                    .map(variation => ({
                      sku: variation.sku,
                    })),
                  deleted: false,
                },
                doc_as_upsert: true,
              });
            });

            return ctx
              .call<GenericObject, Partial<Product>>('products.bulk', {
                index: 'products-instances',
                body: bulk,
              })
              .then(async (response: GenericObject) => {
                // Update products import quantity
                if (response.items) {
                  const firstImport = response.items
                    .filter((item: GenericObject) => item.update._version === 1)
                    .map((item: GenericObject) => item.update._id);
                  res.filter((product: Product) =>
                    firstImport.includes(`${store.consumer_key}-${product.sku}`)
                  );

                  const appSearchProducts = [];

                  for (let i = 0; i < skus.length; i += 100) {
                    appSearchProducts.push(
                      ...(await this.getDocumentsByIds(skus.slice(i, i + 100)))
                    );
                  }

                  const updateArr: GenericObject[] = [];
                  appSearchProducts.forEach((product: Product) => {
                    if (product) {
                      let index = -1;
                      if (product.imported) {
                        index = product.imported.indexOf(store.url);
                      }
                      if (index === -1) {
                        product.imported = (product.imported || []).concat([
                          store.url,
                        ]);
                        updateArr.push({
                          id: product.sku,
                          qty: product.imported.length,
                          attribute: 'import_qty',
                          imported: product.imported,
                        });
                      }
                    }
                  });
                  for (let i = 0; i < updateArr.length; i += 100) {
                    await ctx.call<GenericObject, GenericObject>(
                      'products.updateQuantityAttributes',
                      {
                        products: updateArr.slice(i, i + 100),
                      }
                    );
                  }
                  this.broker.cacher.clean(
                    `products-instances.list:${ctx.meta.user}**`
                  );
                  this.broker.cacher.clean(
                    `products-instances.total:${ctx.meta.user}**`
                  );
                }

                // Responses
                if (response.errors) {
                  throw new MpError(
                    'Products Instance',
                    'There was an error with importing your products!',
                    500
                  );
                }
                return {
                  success: newSKUs,
                  outOfStock,
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
      auth: ['Bearer'],
      handler(
        ctx: Context<UpdateProductParams, MetaParams>
      ): Promise<{ status: string; message: string; sku: string }> {
        const body: { [key: string]: unknown } = {};
        if (ctx.params.externalUrl) body.externalUrl = ctx.params.externalUrl;
        if (ctx.params.externalId) body.externalId = ctx.params.externalId;
        if (ctx.params.variations) body.variations = ctx.params.variations;
        if (ctx.params.error) body.error = ctx.params.error;
        return ctx
          .call<GenericObject, Partial<Product>>('products.update', {
            index: 'products-instances',
            type: '_doc',
            id: `${ctx.meta.user}-${ctx.params.sku}`,
            body: {
              doc: body,
            },
          })
          .then(
            async (res: GenericObject) => {
              if (res.result === 'updated' || res.result === 'noop') {
                await this.broker.cacher.clean(
                  `products-instances.list:${ctx.meta.user}**`
                );
                return {
                  status: 'success',
                  message: 'Updated successfully!',
                  sku: ctx.params.sku,
                };
              }
              throw new MpError(
                'Products Instance',
                'Something went wrong!',
                500
              );
            },
            (err: CommonError) => {
              if (err.message.includes('document_missing_exception')) {
                throw new MpError('Products Instance', 'Not Found!', 404);
              }
              throw new MpError(
                'Products Instance',
                'Something went wrong!',
                500
              );
            }
          );
      },
    },

    /**
     * Bulk products update
     *
     * @returns {Object} Product
     */
    bulkProductInstance: {
      auth: ['Bearer'],
      handler(ctx: Context<Products, MetaParams>): Promise<{ status: string }> {
        const bulk: GenericObject[] = [];
        ctx.params.productInstances.forEach((pi: GenericObject) => {
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
              .then((res: { errors: boolean }) => {
                if (res.errors === false) {
                  return {
                    status: 'success',
                  };
                }
                throw new MpError(
                  'Products Instance',
                  'Something went wrong!',
                  500
                );
              });
      },
    },

    pSearch: {
      auth: ['Bearer'],
      handler(
        ctx: Context<ProductSearchParams, MetaParams>
      ): Promise<Product[]> {
        ctx.params.storeKey = ctx.meta.store.consumer_key;
        return this.search(ctx.params);
      },
    },
  },
  methods: {
    deletePublish(ctx: Context<unknown, MetaParams>, res: Product): Product {
      this.publishMessage('products.delete', {
        storeId: ctx.meta.storeId,
        data: res,
      });
      return res;
    },
    importPublish(
      ctx: Context<unknown, MetaParams>,
      res: {
        success: string[];
        outOfStock: string[];
      }
    ): {
      success: string[];
      outOfStock: string[];
    } {
      this.publishMessage('products.import', {
        storeId: ctx.meta.storeId,
        data: res,
      });
      return res;
    },
    pushPublish(
      ctx: Context<Products, MetaParams>,
      res: { success: string }
    ): { success: string } {
      this.publishMessage('products.push', {
        storeId: ctx.meta.storeId,
        data: {
          skus: ctx.params.sku
            ? ctx.params.sku
            : ctx.params.productInstances.map(
                (product: { sku: string }) => product.sku
              ),
        },
      });
      return res;
    },
  },
};
