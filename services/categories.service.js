const ElasticLib = require('../libs/elastic');

module.exports = {
  name: 'categories',

  /**
   * Service settings
   */
  settings: {},

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
    list: {
      auth: 'required',
      cache: {
        ttl: 60 * 60 // 1 hour
      },
      async handler() {
        const esClient = new ElasticLib();
        const categories = await esClient.fetchCategories();
        return categories;
      }
    }
  }
};
