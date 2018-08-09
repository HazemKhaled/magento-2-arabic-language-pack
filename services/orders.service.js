const uuidv1 = require('uuid/v1');
const { MoleculerClientError } = require('moleculer').Errors;

const KlayerAPI = require('../libs/klayer');

module.exports = {
  name: 'orders',

  /**
   * Service settings
   */
  settings: {},

  /**
   * Service metadata
   */
  metadata: {},

  /**
   * Service dependencies
   */
  // dependencies: [],

  /**
   * Actions
   */
  actions: {
    /**
     * Welcome a username
     *
     * @param {String} name - User name
     */
    create: {
      auth: 'required',
      params: {
        id: { type: 'string' },
        status: { type: 'enum', values: ['pending', 'processing', 'canceled'] },
        items: {
          type: 'array',
          items: 'object',
          props: {
            quantity: { type: 'number', min: 1, max: 10 },
            sku: { type: 'string' }
          }
        },
        shipping: {
          type: 'object',
          props: {
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            company: { type: 'string', optional: true },
            address_1: { type: 'string' },
            address_2: { type: 'string', optional: true },
            city: { type: 'string' },
            state: { type: 'string' },
            postcode: { type: 'string' },
            country: { type: 'string', length: '2' },
            phone: { type: 'string', optional: true },
            email: { type: 'email', optional: true }
          }
        },
        billing: {
          type: 'object',
          optional: true,
          props: {
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            company: { type: 'string', optional: true },
            address_1: { type: 'string' },
            address_2: { type: 'string', optional: true },
            city: { type: 'string' },
            state: { type: 'string' },
            postcode: { type: 'string' },
            country: { type: 'string', length: '2' },
            phone: { type: 'string', optional: true },
            email: { type: 'email', optional: true }
          }
        },
        invoice_url: { type: 'string', optional: true },
        payment_method: { type: 'string' }
      },
      async handler(ctx) {
        const api = new KlayerAPI();
        if (ctx.meta.user) {
          ctx.params.id = uuidv1();
          try {
            const result = await api.createOrder(ctx.params, ctx.meta.user);
            const order = result.data;
            return {
              status: 'success',
              data: {
                id: order.id,
                status: order.status,
                items: order.line_items,
                billing: order.billing,
                shipping: order.shipping,
                createDate: order.date_created,
                payment_method: order.payment_method
              }
            };
          } catch (err) {
            return this.Promise.reject(new MoleculerClientError(err));
          }
        } else {
          return this.Promise.reject(new MoleculerClientError('User not authenticated'));
        }
      }
    },

    get: {
      auth: 'required',
      params: {
        order_id: { type: 'string' }
      },
      handler(ctx) {
        const orderId = ctx.params.order_id;

        return new KlayerAPI().getOrders(0, 1, ctx.meta.user, orderId);
      }
    },

    list: {
      auth: 'required',
      cache: {
        keys: ['page', 'limit', '#token'],
        ttl: 15 * 60 // 10 mins
      },
      async handler(ctx) {
        const { page, limit } = ctx.params;
        const api = new KlayerAPI();
        if (limit > 50) {
          return this.Promise.reject(
            new MoleculerClientError('Maximum Limit is 50 !', 422, '', [
              { field: 'limit', message: 'Max limit is 50' }
            ])
          );
        }
        const orders = await api.getOrders(page, limit, ctx.meta.user);
        return orders;
      }
    },

    update: {
      auth: 'required',
      params: {
        id: { type: 'string' },
        status: { type: 'enum', values: ['pending', 'processing', 'canceled'] },
        items: {
          type: 'array',
          items: 'object',
          props: {
            quantity: { type: 'number', min: 1, max: 10 },
            sku: { type: 'string' }
          }
        },
        shipping: {
          type: 'object',
          props: {
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            company: { type: 'string', optional: true },
            address_1: { type: 'string' },
            address_2: { type: 'string', optional: true },
            city: { type: 'string' },
            state: { type: 'string' },
            postcode: { type: 'string' },
            country: { type: 'string', length: 2 },
            phone: { type: 'string', optional: true },
            email: { type: 'email', optional: true }
          }
        },
        billing: {
          type: 'object',
          optional: true,
          props: {
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            company: { type: 'string', optional: true },
            address_1: { type: 'string' },
            address_2: { type: 'string', optional: true },
            city: { type: 'string' },
            state: { type: 'string' },
            postcode: { type: 'string' },
            country: { type: 'string', length: '2' },
            phone: { type: 'string', optional: true },
            email: { type: 'email', optional: true }
          }
        },
        invoice_url: { type: 'string', optional: true },
        payment_method: { type: 'string' }
      },
      async handler(ctx) {
        const api = new KlayerAPI();
        try {
          const result = await api.updateOrder(ctx.params, ctx.meta.user);
          if (result.statusCode && result.statusCode === 404) {
            return {
              status: 'failed',
              message: 'order not found',
              data: []
            };
          }
          const order = result.data;
          return {
            status: 'success',
            data: {
              id: order.id,
              status: order.status,
              billing: order.billing,
              shipping: order.shipping,
              updateDate: new Date()
            }
          };
        } catch (err) {
          return new MoleculerClientError(err);
        }
      }
    }
  },

  /**
   * Events
   */
  events: {},

  /**
   * Methods
   */
  methods: {},

  /**
   * Service created lifecycle event handler
   */
  created() {},

  /**
   * Service started lifecycle event handler
   */
  started() {},

  /**
   * Service stopped lifecycle event handler
   */
  stopped() {}
};
