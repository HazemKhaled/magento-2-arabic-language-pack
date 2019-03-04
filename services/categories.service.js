const { MoleculerClientError } = require('moleculer').Errors;
const ESService = require('moleculer-elasticsearch');

module.exports = {
  name: 'categories',

  /**
   * Service metadata
   */
  metadata: {},
  mixins: [ESService],

  /**
   * Service settings
   */
  settings: {
    elasticsearch: {
      host: `http://${process.env.ELASTIC_AUTH}@${process.env.ELASTIC_HOST}:${
        process.env.ELASTIC_PORT
      }`
    }
  },

  /**
   * Actions
   */
  actions: {
    /**
     * List All Categories
     *
     * @returns {Array} Categories
     */
    list: {
      auth: 'required',
      cache: {
        ttl: 60 * 60 // 1 hour
      },
      handler() {
        return this.fetchCategories();
      }
    }
  },
  methods: {
    /**
     * Get Categories from ElasticSearch
     *
     * @returns {Array} Categories
     * @memberof ElasticLib
     */
    fetchCategories() {
      return this.broker
        .call('categories.search', {
          index: 'categories',
          type: 'Category',
          body: {
            size: 999
          }
        })
        .then(result => {
          if (result.hits.total === 0) {
            return {
              status: 'failed',
              message: 'There are no categories at the moment.'
            };
          }

          return result.hits.hits.map(category => {
            category = category._source;
            return {
              id: category.odooId,
              name: this.formatI18nText(category.name)
            };
          });
        })
        .catch(err => new MoleculerClientError(err));
    },
    /**
     * Pick only language keys
     *
     * @param {Object} obj
     * @returns
     * @memberof ElasticLib
     */
    formatI18nText(obj) {
      if (!obj) return;

      const output = {};

      ['ar', 'en', 'tr', 'fr'].forEach(key => {
        if (obj[key] && key.length === 2) {
          output[key] = typeof obj[key] === 'string' ? obj[key] : obj[key].text;
        }
      });

      // Cleanup null values
      Object.keys(output).forEach(k => {
        if (!output[k]) delete output[k];
      });

      return Object.keys(output).length ? output : false;
    }
  }
};
