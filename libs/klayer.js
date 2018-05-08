const request = require('request-promise');
/**
 * Klayer Interface
 *
 * @class KlayerLib
 */
class KlayerLib {
  /**
   * Creates an instance of KlayerLib.
   *
   * @memberof KlayerLib
   */
  constructor() {
    this.access_token =
      process.env.TOKEN || 'dbbf3cb7-f7ad-46ce-bee3-4fd7477951c4';
    this.API_URL = process.env.API_URL || 'https://api.knawat.com';
  }

  /**
   * Get instance by consumerKey
   *
   * @param {String} consumerKey -
   * @returns {Object}
   * @memberof KlayerLib
   */
  async findInstance(consumerKey) {
    try {
      const instance = await request({
        method: 'get',
        uri: this.getUrl(
          `Instances?filter=${JSON.stringify({
            where: { webhook_hash: consumerKey }
          })}`
        ),
        qs: {
          access_token: this.access_token
        },
        headers: {
          'User-Agent': 'Request-Middleware'
        },
        json: true
      });
      return instance;
    } catch (err) {
      return err;
    }
  }

  /**
   * Get Currency Rate
   *
   * @param {Number} id
   * @returns {Number} Rate
   * @memberof KlayerLib
   */
  async currencyRate(id) {
    try {
      const currency = await request({
        method: 'GET',
        uri: this.getUrl(`Currencies/${id}`),
        qs: {
          access_token: this.access_token
        },
        headers: {
          'User-Agent': 'Request-Middleware'
        },
        json: true
      });
      return currency.rate;
    } catch (err) {
      return err.message;
    }
  }

  /**
   * Create Order in Klayer
   *
   * @param {Object} order
   * @returns {Object} response
   * @memberof KlayerLib
   */
    try {
      const currency = await request({
        method: 'GET',
        uri: this.getUrl(`Currencies/${id}`),
        qs: {
          access_token: this.access_token
        },
        headers: {
          'User-Agent': 'Request-Middleware'
        },
        json: true
      });
      return currency.rate;
    } catch (err) {
      return err.message;
    }
  }

  /**
   * Get Formatted URL
   *
   * @param {String} endpoint
   * @returns {String} URL
   * @memberof KlayerLib
   */
  getUrl(endpoint) {
    // if URL doesn't have / at the end add it
    let url =
      this.API_URL.slice(-1) === '/' ? this.API_URL : `${this.API_URL}/`;
    // Add API base
    const api = 'api/';
    // Concat the final URL
    url = url + api + endpoint;
    return url;
  }
}

module.exports = KlayerLib;
