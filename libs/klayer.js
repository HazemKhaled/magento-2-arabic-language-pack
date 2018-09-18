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
    this.access_token = process.env.KLAYER_TOKEN || 'dbbf3cb7-f7ad-46ce-bee3-4fd7477951c4';
    this.API_URL = process.env.KLAYER_URL || 'https://dev.api.knawat.io';
  }

  /**
   * Get instance by consumerKey
   *
   * @param {String} consumerKey instance webhook_hash
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
          'User-Agent': 'Request-MicroES'
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
   * @param {String} currencyCode
   * @returns {Number} Rate
   * @memberof KlayerLib
   */
  async currencyRate(currencyCode) {
    try {
      const currency = await request({
        method: 'GET',
        uri: this.getUrl(`Currencies/${currencyCode}`),
        qs: {
          access_token: this.access_token
        },
        headers: {
          'User-Agent': 'Request-MicroES'
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
   * @param {String} consumerKey instance webhook_hash
   * @returns {Object} response
   * @memberof KlayerLib
   */
  async createOrder(order, consumerKey) {
    const [instance] = await this.findInstance(consumerKey);
    const hash = instance.webhook_hash;

    try {
      const created = await request({
        method: 'POST',
        uri: this.getUrl(`webhook/orders/create/${hash}`),
        qs: {
          access_token: this.access_token
        },
        headers: {
          'User-Agent': 'Request-MicroES'
        },
        body: order,
        json: true
      });
      return created;
    } catch (err) {
      return new MoleculerClientError(err);
    }
  }

  /**
   * Create Order in Klayer
   *
   * @param {Object} order
   * @param {String} consumerKey instance webhook_hash
   * @returns {Object} response
   * @memberof KlayerLib
   */
  async updateOrder(order, consumerKey) {
    const [instance] = await this.findInstance(consumerKey);
    const hash = instance.webhook_hash;
    try {
      const updated = await request({
        method: 'POST',
        uri: this.getUrl(`webhook/orders/update/${hash}`),
        qs: {
          access_token: this.access_token
        },
        headers: {
          'User-Agent': 'Request-MicroES'
        },
        body: order,
        json: true
      });
      return updated;
    } catch (err) {
      return new MoleculerClientError(err);
    }
  }

  /**
   * Get Order By ID or Get All Orders: Both by Instance Hash
   *
   * @param {int} page
   * @param {int} limit
   * @param {String} consumerKey instance webhook_hash
   * @param {String} orderId order id
   * @returns
   * @memberof KlayerLib
   */
  async getOrders(page, limit, consumerKey, orderId) {
    const [instance] = await this.findInstance(consumerKey);

    const partnerId = instance.partner_id;
    const query = !orderId ? { partner_id: partnerId } : { partner_id: partnerId, id: orderId };

    try {
      const orderLimit = limit === undefined ? 10 : limit;
      const orderSkip = page > 0 ? (page - 1) * orderLimit : 0;
      let orders = await request({
        method: 'GET',
        uri: this.getUrl(
          `webhook/orders?filter=${JSON.stringify({
            where: query,
            limit: orderLimit,
            skip: orderSkip
          })}`
        ),
        qs: {
          access_token: this.access_token
        },
        headers: {
          'User-Agent': 'Request-MicroES'
        },
        json: true
      });

      orders = orders.map(order => {
        const formattedOrder = {
          id: order.id,
          status: order.status,
          items: order.line_items,
          billing: order.billing,
          shipping: order.shipping,
          createDate: order.date_created,
          knawat_order_status: order.state ? this.getStatusName(order.state) : ''
        };
        if (order.meta_data && order.meta_data.length > 0) {
          order.meta_data.forEach(meta => {
            if (
              meta.key === '_shipment_tracking_number' ||
              meta.key === '_shipment_provider_name' ||
              meta.key === '_knawat_order_status'
            ) {
              formattedOrder[meta.key.substring(1)] = meta.value || '';
              if (meta.key === '_knawat_order_status') {
                formattedOrder[meta.key.substring(1)] = this.getStatusName(meta.value) || '';
              }
            }
          });
        }
        return formattedOrder;
      });
      // for case of single order.
      if (orderId) {
        const [order] = orders;
        return order;
      }
      return orders;
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
    let url = this.API_URL.slice(-1) === '/' ? this.API_URL : `${this.API_URL}/`;
    // Add API base
    const api = 'api/';
    // Concat the final URL
    url = url + api + endpoint;
    return url;
  }

  /**
   * Get Status Name
   *
   * @param {String} Status
   * @returns {String} Status Name
   * @memberof KlayerLib
   */
  getStatusName(status) {
    const stateNames = {
      draft: 'Order Placed',
      sent: 'Sent',
      on_hold: 'On-hold',
      sale: 'Processing',
      shipped: 'Shipped',
      done: 'Shipped',
      cancel: 'Cancelled',
      error: '...'
    };
    if (stateNames[status]) {
      return stateNames[status];
    }
    return '';
  }
}

module.exports = KlayerLib;
