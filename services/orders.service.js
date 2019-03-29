const uuidv1 = require('uuid/v1');
const { MoleculerClientError } = require('moleculer').Errors;

const entityValidator = {
  id: { type: 'string', empty: false },
  status: { type: 'enum', values: ['pending', 'processing', 'cancelled'] },
  items: {
    type: 'array',
    items: 'object',
    min: 1,
    props: {
      quantity: { type: 'number', min: 1, max: 10 },
      sku: { type: 'string', empty: false }
    }
  },
  shipping: {
    type: 'object',
    props: {
      first_name: { type: 'string', empty: false },
      last_name: { type: 'string', empty: false },
      company: { type: 'string', optional: true },
      address_1: { type: 'string', empty: false },
      address_2: { type: 'string', optional: true },
      city: { type: 'string', empty: false },
      state: { type: 'string', optional: true },
      postcode: { type: 'string', optional: true },
      country: { type: 'string', length: 2 },
      phone: { type: 'string', optional: true },
      email: { type: 'email', optional: true }
    }
  },
  billing: {
    type: 'object',
    optional: true,
    props: {
      first_name: { type: 'string', empty: false },
      last_name: { type: 'string', empty: false },
      company: { type: 'string', optional: true },
      address_1: { type: 'string', empty: false },
      address_2: { type: 'string', optional: true },
      city: { type: 'string', empty: false },
      state: { type: 'string', optional: true },
      postcode: { type: 'string', optional: true },
      country: { type: 'string', length: 2 },
      phone: { type: 'string', optional: true },
      email: { type: 'email', optional: true }
    }
  },
  invoice_url: { type: 'string', optional: true },
  payment_method: { type: 'string', empty: false }
};

module.exports = {
  name: 'orders',

  /**
   * Service settings
   */
  settings: {},

  /**
   * Service metadata
   */
  metadata: {
    entityValidator
  },

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
      params: entityValidator,
      async handler(ctx) {
        if (ctx.meta.user) {
          ctx.params.id = uuidv1();
          try {
            // @TODO: transformation needed.
            const data = ctx.params;
            if (ctx.params.invoice_url) {
              data.pdf_invoice_url = ctx.params.invoice_url;
            }

            const result = await ctx.call('klayer.createOrder', {
              order: data,
              consumerKey: ctx.meta.user
            });
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

        return ctx.call('klayer.getOrders', {
          page: 0,
          limit: 1,
          consumerKey: ctx.meta.user,
          orderId: orderId
        });
      }
    },

    list: {
      auth: 'required',
      params: {
        limit: {
          type: 'number',
          convert: true,
          integer: true,
          min: 1,
          max: 50,
          optional: true
        },
        page: { type: 'number', convert: true, integer: true, min: 1, optional: true }
      },
      cache: {
        keys: ['page', 'limit', '#token'],
        ttl: 15 * 60 // 10 mins
      },
      async handler(ctx) {
        const { page, limit } = ctx.params;

        const orders = await ctx.call('klayer.getOrders', {
          page: page,
          limit: limit,
          consumerKey: ctx.meta.user
        });
        return orders;
      }
    },

    update: {
      auth: 'required',
      params: entityValidator,
      async handler(ctx) {
        try {
          // @TODO: transformation needed.
          const data = ctx.params;
          if (ctx.params.invoice_url) {
            data.pdf_invoice_url = ctx.params.invoice_url;
          }

          const result = await ctx.call('klayer.updateOrder', {
            order: data,
            consumerKey: ctx.meta.user
          });
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
