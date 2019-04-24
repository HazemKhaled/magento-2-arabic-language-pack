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
  payment_method: { type: 'string', empty: false, optional: true }
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
      auth: 'Bearer',
      params: entityValidator,
      async handler(ctx) {
        if (ctx.meta.user && ctx.params.shipping.company !== 'ebay') {
          ctx.params.id = uuidv1();
          try {
            // @TODO: transformation needed.
            const data = ctx.params;
            if (ctx.params.invoice_url) {
              data.pdf_invoice_url = ctx.params.invoice_url;
            }

            const result = await ctx.call('klayer.createOrder', {
              order: data
            });
            const order = result.data;
            this.broker.cacher.clean(`orders.list:${ctx.meta.token}**`);
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
      auth: 'Bearer',
      params: {
        order_id: { type: 'string' }
      },
      handler(ctx) {
        const orderId = ctx.params.order_id;

        return ctx
          .call('klayer.getOrders', {
            page: 0,
            limit: 1,
            consumerKey: ctx.meta.user,
            orderId: orderId
          })
          .then(res =>
            typeof res === 'object'
              ? res
              : {
                  id: -1,
                  status: 'not found'
                }
          );
      }
    },

    list: {
      auth: 'Bearer',
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
        keys: ['#token', 'page', 'limit'],
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
      auth: 'Bearer',
      params: {
        id: { type: 'string', empty: false },
        status: { type: 'enum', values: ['pending', 'processing', 'cancelled'] },
        items: {
          type: 'array',
          optional: true,
          items: 'object',
          min: 1,
          props: {
            quantity: { type: 'number', min: 1, max: 10 },
            sku: { type: 'string', empty: false }
          }
        },
        shipping: {
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
        payment_method: { type: 'string', empty: false, optional: true }
      },
      async handler(ctx) {
        try {
          // @TODO: transformation needed.
          const data = ctx.params;
          if (ctx.params.invoice_url) {
            data.pdf_invoice_url = ctx.params.invoice_url;
          }
          if (data.status === 'cancelled')
            return ctx.call('orders.delete', { id: data.id }).then(res => {
              this.broker.cacher.clean(`orders.list:${ctx.meta.token}**`);
              return res;
            });
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
          this.broker.cacher.clean(`orders.list:${ctx.meta.token}**`);
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
    },
    delete: {
      auth: 'Bearer',
      params: {
        id: { type: 'string', convert: true }
      },
      handler(ctx) {
        return ctx
          .call('klayer.deleteOrder', { id: ctx.params.id })
          .then(() => {
            this.broker.cacher.clean(`orders.list:${ctx.meta.token}**`);
            return {
              status: 'success',
              data: {
                order_id: ctx.params.id
              }
            };
          })
          .catch(err => new MoleculerClientError(err));
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
