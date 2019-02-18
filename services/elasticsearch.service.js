const ESService = require('moleculer-elasticsearch');

module.exports = {
  name: 'products',
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
  }
};
