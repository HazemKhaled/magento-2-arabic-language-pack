const request = require('request-promise');
const { MoleculerClientError } = require('moleculer').Errors;

module.exports = {
  name: 'klayer',
  settings: {
    access_token: process.env.KLAYER_TOKEN,
    API_URL: process.env.KLAYER_URL
  },
  actions: {
    /**
     * Create Order in Klayer
     *
     * @param {Object} order
     * @returns {Object} response
     * @memberof KlayerService
     */
    createOrder: {
      params: {
        order: { type: 'object' }
      },
      handler(ctx) {
        return request({
          method: 'POST',
          uri: this.getUrl(`webhook/orders/create/${ctx.meta.user}`),
          qs: {
            access_token: this.settings.access_token
          },
          headers: {
            'User-Agent': 'Request-MicroES'
          },
          body: ctx.params.order,
          json: true
        }).catch(error => {
          throw new MoleculerClientError(error.message, error.code, error.type, ctx.params);
        });
      }
    },

    /**
     * Create Order in Klayer
     *
     * @param {Object} order
     * @returns {Object} response
     * @memberof KlayerService
     */
    updateOrder: {
      params: {
        order: { type: 'object' }
      },
      handler(ctx) {
        return request({
          method: 'POST',
          uri: this.getUrl(`webhook/orders/update/${ctx.meta.user}`),
          qs: {
            access_token: this.settings.access_token
          },
          headers: {
            'User-Agent': 'Request-MicroES'
          },
          body: ctx.params.order,
          json: true
        }).catch(error => {
          throw new MoleculerClientError(error.message, error.code, error.type, ctx.params);
        });
      }
    },

    /**
     * Get Order By ID or Get All Orders: Both by Instance Hash
     *
     * @param {int} page
     * @param {int} limit
     * @param {String} orderId order id
     * @returns
     * @memberof KlayerService
     */
    getOrders: {
      params: {
        page: { type: 'number', convert: true, integer: true, optional: true },
        limit: { type: 'number', convert: true, integer: true, optional: true },
        orderId: { type: 'string', optional: true }
      },
      async handler(ctx) {
        const { page = 1, limit = 10, orderId } = ctx.params;
        const query = !orderId
          ? { webhook_hash: ctx.meta.user }
          : { webhook_hash: ctx.meta.user, id: orderId };

        try {
          const orderSkip = page > 0 ? (page - 1) * limit : 0;
          let orders = await request({
            method: 'GET',
            uri: this.getUrl(
              `webhook/orders?filter=${JSON.stringify({
                where: query,
                limit: limit,
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
              total: order.total,
              createDate: order.date_created,
              knawat_order_status:
                order.knawat_status || order.state
                  ? this.getStatusName(order.knawat_status || order.state)
                  : ''
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
    },
    deleteOrder: {
      params: {
        id: { type: 'string', convert: true }
      },
      handler(ctx) {
        return request({
          method: 'POST',
          uri: this.getUrl(`webhook/orders/cancel/${ctx.meta.user}`),
          qs: {
            access_token: this.settings.access_token
          },
          headers: {
            'User-Agent': 'Request-MicroES',
            'x-shopify-topic': 'orders/cancelled'
          },
          body: {
            id: ctx.params.id,
            status: 'cancelled'
          },
          json: true
        }).catch(error => {
          throw new MoleculerClientError(error.message, error.code, error.type, ctx.params);
        });
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
      return 'Order Placed';
    }
  }
};
