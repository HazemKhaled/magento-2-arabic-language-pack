const request = require('request-promise');
const { MoleculerClientError } = require('moleculer').Errors;

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
          'User-Agent': 'Request-MicroEs'
        },
        json: true
      });
      return instance;
    } catch (err) {
      return new MoleculerClientError(err);
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
          'User-Agent': 'Request-MicroEs'
        },
        json: true
      });
      return currency.rate;
    } catch (err) {
      return new MoleculerClientError(err.message);
    }
  }

  /**
   * Create Order in Klayer
   *
   * @param {Object} order
   * @returns {Object} response
   * @memberof KlayerLib
   */
  async createOrder(order, id) {
    let instance = await this.findInstance(id);
    instance = instance['0'];
    const hash = instance.webhook_hash;

    try {
      const created = await request({
        method: 'POST',
        uri: this.getUrl(`webhook/orders/create/${hash}`),
        qs: {
          access_token: this.access_token
        },
        headers: {
          'User-Agent': 'Request-MicroES',
        },
        body: order,
        json: true
      });
      return created;
    } catch (err) {
      return err.message;
    }
  }

  /**
   * Get Order By ID or Get All Orders: Both by Instance Hash
   *
   * @param {String} id order id
   * @param {String} hash instance webhook_hash
   * @memberof KlayerLib
   */
  async getOrders(hash, id) {
    let instance = await this.findInstance(hash);
    instance = instance['0'];
    const partner = instance.partner_id;
    const query = id === undefined ? { partner_id: partner } : { partner_id: partner, id: id };
    try {
      const orders = await request({
        method: 'GET',
        uri: this.getUrl(`webhook/orders?filter=${JSON.stringify({
          where: query
        })}`),
        qs: {
          access_token: this.access_token
        },
        headers: {
          'User-Agent': 'Request-MicroEs'
        },
        json: true
      });
      if (id) {
        return orders[0];
      } else {
        return orders;
      }
    } catch (err) {
      return new MoleculerClientError(err);
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
