const request = require('request-promise');
const { MoleculerClientError } = require('moleculer').Errors;

module.exports = {
  name: 'klayer',
  settings: {
    access_token: process.env.KLAYER_TOKEN || 'dbbf3cb7-f7ad-46ce-bee3-4fd7477951c4',
    API_URL: process.env.KLAYER_URL || 'https://dev.api.knawat.io'
  },
  actions: {
    /**
     * Get instance by consumerKey
     *
     * @param {String} consumerKey instance webhook_hash
     * @returns {Object}
     * @memberof KlayerService
     */
    findInstance: {
      params: {
        consumerKey: { type: 'string' }
      },
      async handler(ctx) {
        try {
          const instance = await request({
            method: 'get',
            uri: this.getUrl(
              `Instances?filter=${JSON.stringify({
                where: { webhook_hash: ctx.params.consumerKey }
              })}`
            ),
            qs: {
              access_token: this.settings.access_token
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
    },

    /**
     * Get Currency Rate
     *
     * @param {String} currencyCode
     * @returns {Number} Rate
     * @memberof KlayerService
     */
    currencyRate: {
      params: {
        currencyCode: { type: 'string' }
      },
      async handler(ctx) {
        try {
          const currency = await request({
            method: 'GET',
            uri: this.getUrl(`Currencies/${ctx.params.currencyCode}`),
            qs: {
              access_token: this.settings.access_token
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
    },

    /**
     * Create Order in Klayer
     *
     * @param {Object} order
     * @param {String} consumerKey instance webhook_hash
     * @returns {Object} response
     * @memberof KlayerService
     */
    createOrder: {
      params: {
        order: { type: 'object' },
        consumerKey: { type: 'string' }
      },
      async handler(ctx) {
        const [instance] = await ctx.call('klayer.findInstance', {
          consumerKey: ctx.params.consumerKey
        });
        const hash = instance.webhook_hash;

        try {
          const created = await request({
            method: 'POST',
            uri: this.getUrl(`webhook/orders/create/${hash}`),
            qs: {
              access_token: this.settings.access_token
            },
            headers: {
              'User-Agent': 'Request-MicroES'
            },
            body: ctx.params.order,
            json: true
          });
          return created;
        } catch (err) {
          return new MoleculerClientError(err);
        }
      }
    },

    /**
     * Create Order in Klayer
     *
     * @param {Object} order
     * @param {String} consumerKey instance webhook_hash
     * @returns {Object} response
     * @memberof KlayerService
     */
    updateOrder: {
      params: {
        order: { type: 'object' },
        consumerKey: { type: 'string' }
      },
      async handler(ctx) {
        const [instance] = await ctx.call('klayer.findInstance', {
          consumerKey: ctx.params.consumerKey
        });
        const hash = instance.webhook_hash;
        try {
          const updated = await request({
            method: 'POST',
            uri: this.getUrl(`webhook/orders/update/${hash}`),
            qs: {
              access_token: this.settings.access_token
            },
            headers: {
              'User-Agent': 'Request-MicroES'
            },
            body: ctx.params.order,
            json: true
          });
          return updated;
        } catch (err) {
          return new MoleculerClientError(err);
        }
      }
    },

    /**
     * Get Order By ID or Get All Orders: Both by Instance Hash
     *
     * @param {int} page
     * @param {int} limit
     * @param {String} consumerKey instance webhook_hash
     * @param {String} orderId order id
     * @returns
     * @memberof KlayerService
     */
    getOrders: {
      params: {
        page: { type: 'number' },
        limit: { type: 'number' },
        consumerKey: { type: 'string' },
        orderId: { type: 'string', optional: true }
      },
      async handler(ctx) {
        const [instance] = await ctx.call('klayer.findInstance', {
          consumerKey: ctx.params.consumerKey
        });

        const partnerId = instance.partner_id;
        const query = !ctx.params.orderId
          ? { partner_id: partnerId }
          : { partner_id: partnerId, id: ctx.params.orderId };

        try {
          const orderLimit = ctx.params.limit === undefined ? 10 : ctx.params.limit;
          const orderSkip = ctx.params.page > 0 ? (ctx.params.page - 1) * orderLimit : 0;
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
              access_token: this.settings.access_token
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
          if (ctx.params.orderId) {
            const [order] = orders;
            return order;
          }
          return orders;
        } catch (err) {
          return new MoleculerClientError(err);
        }
      }
    }
  },
  methods: {
    /**
     * Get Formatted URL
     *
     * @param {String} endpoint
     * @returns {String} URL
     * @memberof KlayerService
     */
    getUrl(endpoint) {
      // if URL doesn't have / at the end add it
      let url =
        this.settings.API_URL.slice(-1) === '/'
          ? this.settings.API_URL
          : `${this.settings.API_URL}/`;
      // Add API base
      const api = 'api/';
      // Concat the final URL
      url = url + api + endpoint;
      return url;
    },

    /**
     * Get Status Name
     *
     * @param {String} Status
     * @returns {String} Status Name
     * @memberof KlayerService
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
};
