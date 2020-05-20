import Loop from 'bluebird';
import { Context, Errors, ServiceSchema } from 'moleculer';
import * as Cron from 'moleculer-cron';
import ESService, { SearchResponse } from 'moleculer-elasticsearch';

import { DbMixin, AppSearch } from '../utilities/mixins';
import { Product } from '../utilities/types';

const { MoleculerClientError } = Errors;
const TheService: ServiceSchema = {
  name: 'elastic-update',

  /**
   * Crons
   */
  crons: [
    {
      name: 'updateInstanceProducts',
      cronTime: '* * * * *', // Every minute
      onTick() {
        if (this.call && process.env.NODE_ENV !== 'development') {
          this.logger.info('Update Instance Products Cron ticked');
          this.call('elastic-update.run');
        } else {
          this.logger.warn('elastic-update not working on development environment');
        }
      },
    },
  ],

  /**
   * Service Mixins
   */
  mixins: [DbMixin('elastic-update'), Cron, ESService, AppSearch('catalog')],

  /**
   * Service settings
   */
  settings: {
    elasticsearch: {
      host: process.env.ELASTIC_URL,
      httpAuth: process.env.ELASTIC_AUTH,
      apiVersion: process.env.ELASTIC_VERSION || '6.x',
    },
    isRunning: false,
  },

  /**
   * Service metadata
   */
  metadata: {},

  /**
   * Actions
   */
  actions: {
    /**
     * List All Categories
     *
     * @returns {Array} Categories
     */
    run: {
      async handler(ctx: Context) {
        // Don't run if another cron not completed
        if (this.settings.isRunning) {
          this.logger.info('Update instance Products is already running');
          return;
        }

        this.settings.isRunning = true;
        const lastUpdateDate = await this.getLastUpdateDate();

        if (lastUpdateDate) {
          const products = await this.syncInstanceProducts(lastUpdateDate);
          if (products && products.success === true) {
            if (products.LastDate) {
              const updated = await this.updateLastUpdateDate(products.LastDate, ctx);
              if (updated) {
                this.logger.info('Last Updated Date Updated', products.LastDate);
              }
            } else if (products.noProducts) {
              this.logger.info('No Products for Update');
            }
          }
        } else {
          this.logger.error('something went wrong during get last update date');
        }
        this.settings.isRunning = false;
      },
    },
  },

  /**
   * Methods
   */
  methods: {
    /**
     * Update products from "products" to "products-instances"
     *
     * @returns
     * @memberof ElasticLib
     */
    async syncInstanceProducts(lastUpdateDate: string | number | Date) {
      if (!lastUpdateDate && lastUpdateDate === '') {
        return false;
      }

      const searchResponse: { results: Product[] } = await this.documentsSearch('', {
        filters: {
          updated: { from: new Date(lastUpdateDate) },
        },
        sort: { updated: 'asc' },
        page: {
          size: +process.env.ELASTIC_UPDATE_LIMIT || 1000,
        },
      });

      if (
        searchResponse.results.length === 0
      ) {
        return {
          success: true,
          LastDate: '',
          noProducts: true,
        };
      }

      if (searchResponse.results.length > 0) {
        const LastDate =
          searchResponse.results[searchResponse.results.length - 1].updated || '';
        const isUpdated = await this.bulkUpdateInstanceProducts(searchResponse.results);
        if (isUpdated) {
          return {
            success: true,
            LastDate,
          };
        }
      } else {
        return false;
      }
    },
    /**
     * Bulk Update Products in ElasticSearch "products-instances"
     *
     * @param {Array } products
     * @returns
     * @memberof ElasticLib
     */
    async bulkUpdateInstanceProducts(products: Product[]) {
      let result = true;
      await Loop.each(products, async hit => {
        // If no product came, mark ar archived
        const product: Product = hit || { archive: true, updated: new Date() };
        const updateData = {
          index: 'products-instances',
          body: {
            query: {
              term: {
                'sku.keyword': product.sku,
              },
            },
            script: {
              params: {
                productArchive: product.archive || false,
                productUpdated: product.updated || new Date(),
              },
              source:
                'ctx._source.archive=params.productArchive; ctx._source.updated=params.productUpdated;',
              lang: 'painless',
            },
          },
          conflicts: 'proceed',
        };
        try {
          const updated = await this.broker.call('elastic-update.call', {
            api: 'updateByQuery',
            params: updateData,
          });
          if (updated && updated.failures.length === 0) {
            this.logger.info(`[SUCCESS] ${product.sku} has been Updated`);
          }
          if (updated && updated.failures.length > 0) {
            this.logger.error(`[ERROR] ${product.sku}`, updated);
            result = false;
          }
        } catch (err) {
          this.logger.error(`[ERROR] ${product.sku} Error: `, err);
          result = false;
          return new MoleculerClientError(err);
        }
      });
      return result;
    },
    /**
     * Get Last Run Date
     *
     * @returns
     */
    getLastUpdateDate() {
      const query = {
        query: { _id: 'last_update_date' },
      };
      return this.Promise.resolve()
        .then(() => this.adapter.find(query))
        .then(([date]: [{ date: any }]) =>
          date && date.date ? date.date : new Date('1970-01-01T12:00:00.000Z'),
        )
        .catch((err: Error) => {
          this.logger.error('ERROR_DURING_GET_LAST_DATE', err);
        });
    },

    /**
     * Update last Run date
     *
     * @param {string} [date='1970-01-01T12:00:00.000Z']
     * @param {*} ctx
     * @returns
     */
    updateLastUpdateDate(date = '1970-01-01T12:00:00.000Z', ctx: any) {
      const query = {
        query: { _id: 'last_update_date' },
      };

      return this.Promise.resolve()
        .then(() => this.adapter.find(query))
        .then(([dateValue]: [any]) => {
          if (dateValue) {
            return this.adapter
              .updateById('last_update_date', { $set: { date: new Date(date) } })
              .then((json: object) => this.entityChanged('updated', json, ctx).then(() => json))
              .catch((err: object) => {
                this.logger.error('ERROR_DURING_UPDATE_LAST_DATE', err);
              });
          }

          return this.adapter
            .insert({ _id: 'last_update_date', date: new Date(date) })
            .then((json: object) => this.entityChanged('created', json, ctx).then(() => json))
            .catch((err: object) => {
              this.logger.error('ERROR_DURING_INSERT_LAST_DATE', err);
            });
        })
        .catch((err: object) => {
          this.logger.error('ERROR_DURING_UPDATE_LAST_DATE', err);
        });
    },
  },
};

export = TheService;
