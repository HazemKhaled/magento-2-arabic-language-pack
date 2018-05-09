const KlayerAPI = require('../libs/klayer');
const uuidv1 = require('uuid/v1');
const { MoleculerClientError } = require('moleculer').Errors;

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
        status: { type: 'string' },
        items: { type: 'array', items: 'object' },
        billing: {
          type: 'object',
          props: {
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            company: { type: 'string' },
            city: { type: 'string' },
            address_1: { type: 'string' },
            address_2: { type: 'string' },
            phone: { type: 'string' },
            postcode: { type: 'string' },
            state: { type: 'string' },
            country: { type: 'string' },
            email: { type: 'email' },
          }
        },
        shipping: {
          type: 'object',
          props: {
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            company: { type: 'string', optional: true },
            city: { type: 'string' },
            address_1: { type: 'string' },
            address_2: { type: 'string' },
            phone: { type: 'string' },
            postcode: { type: 'string' },
            state: { type: 'string' },
            country: { type: 'string' },
            email: { type: 'email' },
          }
        },
        invoice_url: { type: 'string' },
      },
      async handler(ctx) {
        const api = new KlayerAPI();
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
              createDate: order.date_created
            }
          };
        } catch (err) {
          return new MoleculerClientError(err);
        }
      }
    },

    get: {
      auth: 'required',
      params: {
        order_id: { type: 'string' },
      },
      async handler(ctx) {
        const id = ctx.params.order_id;
        const api = new KlayerAPI();
        const order = await api.getOrders(ctx.meta.user, id);

        return order;
      }
    },

    list: {
      auth: 'required',
      async handler(ctx) {
        const api = new KlayerAPI();
        const orders = await api.getOrders(ctx.meta.user);
        return orders;
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
