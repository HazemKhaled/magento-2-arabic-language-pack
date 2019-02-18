const Cron = require('moleculer-cron');
const { MoleculerClientError } = require('moleculer').Errors;
const Loop = require('bluebird');
const DbService = require('../mixins/db.mixin');

module.exports = {
  name: 'elastic-update',

  /**
   * Crons
   */
  crons: [
    {
      name: 'updateInstanceProducts',
      cronTime: '* * * * *', // Every minute
      onTick() {
        if (this.logger && process.env.NODE_ENV !== 'development') {
          this.logger.info('Update Instance Products Cron ticked');
        }
        if (this.call && process.env.NODE_ENV !== 'development') {
          this.call('elastic-update.run');
        }
      }
    }
  ],

  /**
   * Service Mixins
   */
  mixins: [DbService('elastic-update'), Cron],

  /**
   * Service settings
   */
  settings: {
    isRunning: false
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
      async handler(ctx) {
        if (this.settings.isRunning) {
          this.logger.info('Update instance Products is already running');
          return;
        }
        this.settings.isRunning = true;
        const lastUpdateDate = await this.getLastUpdateDate();
        if (lastUpdateDate) {
          const products = await this.syncInstanceProducts(lastUpdateDate);
          if (products && products.success === true) {
            if (products.LastDate && products.LastDate !== '') {
              const updated = await this.updateLastUpdateDate(new Date(products.LastDate), ctx);
              if (updated) {
                this.logger.info('Last Updated Date Updated');
              }
            } else if (products.noProducts) {
              this.logger.info('No Products for Update');
            }
          }
        } else {
          this.logger.error('something went wrong during get last update date');
        }
        this.settings.isRunning = false;
      }
    }
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
    async syncInstanceProducts(lastUpdateDate) {
      if (!lastUpdateDate && lastUpdateDate === '') {
        return false;
      }
      const limit = process.env.ELASTIC_UPDATE_LIMIT || 999;
      const products = await this.broker
        .call('elasticsearch.search', {
          index: 'products',
          type: 'Product',
          body: {
            query: {
              range: {
                updated: { gt: new Date(lastUpdateDate) }
              }
            },
            sort: { updated: { order: 'asc' } }
          },
          size: limit
        })
        .catch(err => new MoleculerClientError(err));

      if (products.hits && products.hits.hits && products.hits.hits.length === 0) {
        return {
          success: true,
          LastDate: '',
          noProducts: true
        };
      }

      if (products.hits && products.hits.hits && products.hits.hits.length > 0) {
        const LastDate = products.hits.hits[products.hits.hits.length - 1]._source.updated || '';
        const isUpdated = await this.bulkUpdateInstanceProducts(products.hits.hits);
        if (isUpdated) {
          return {
            success: true,
            LastDate
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
    async bulkUpdateInstanceProducts(products) {
      let result = true;
      await Loop.each(products, async product => {
        product = product._source;
        const updateData = {
          index: 'products-instances',
          type: 'product',
          body: {
            query: {
              term: {
                'sku.keyword': product.sku
              }
            },
            script: {
              params: {
                productArchive: product.archive || false,
                productUpdated: product.updated || new Date()
              },
              inline:
                'ctx._source.archive=params.productArchive; ctx._source.updated=params.productUpdated;',
              lang: 'painless'
            }
          },
          conflicts: 'proceed'
        };
        try {
          const updated = await this.broker.call('elasticsearch.call', {
            api: 'updateByQuery',
            params: updateData
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
        query: { key: 'last_update_date' }
      };
      return this.Promise.resolve()
        .then(() => this.adapter.find(query))
        .then(date => {
          if (typeof date !== 'undefined' && date.length > 0) {
            return date[0].date;
          }
          return new Date('2001-01-01T12:00:00.000Z');
        })
        .catch(err => this.logger.error('ERROR_DURRING_GET_LASTDATE', err));
    },

    /**
     * Update last Run date
     *
     * @param {Date} date
     * @returns
     */
    updateLastUpdateDate(date, ctx) {
      if (date && date !== '') {
        const update = { date };
        const query = {
          query: { key: 'last_update_date' }
        };
        return this.Promise.resolve()
          .then(() => this.adapter.find(query))
          .then(dateValue => {
            if (typeof dateValue !== 'undefined' && dateValue.length > 0) {
              return this.adapter
                .updateMany({ key: 'last_update_date' }, { $set: update })
                .then(json => this.entityChanged('updated', json, ctx).then(() => json))
                .catch(err => this.logger.error('ERROR_DURRING_UPDATE_LASTDATE', err));
            }
            return this.adapter
              .insert({ key: 'last_update_date', date })
              .then(json => this.entityChanged('created', json, ctx).then(() => json))
              .catch(err => this.logger.error('ERROR_DURRING_INSERT_LASTDATE', err));
          })
          .catch(err => {
            this.logger.error('ERROR_DURRING_UPDATE_LASTDATE', err);
          });
      }
    }
  }
};
