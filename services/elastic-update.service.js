const Cron = require('moleculer-cron');
const ElasticLib = require('../libs/elastic');
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
      onTick: () => {
        // this.logger.info('Update Instance Products Cron ticked');
      },
      runOnInit: () => {
        // this.logger.info("Update Instance Products Cron is created");
      },
      start: true
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
        }
        this.settings.isRunning = true;
        const esClient = new ElasticLib();
        const lastUpdateDate = await this.getLastUpdateDate();
        if (lastUpdateDate) {
          const products = await esClient.syncInstanceProducts(lastUpdateDate);
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
