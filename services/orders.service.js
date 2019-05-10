const uuidv1 = require('uuid/v1');
const ESService = require('moleculer-elasticsearch');
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
  invoice_url: { type: 'string', optional: true },
  payment_method: { type: 'string', empty: false, optional: true }
};

module.exports = {
  name: 'orders',
  settings: {
    elasticsearch: {
      host: `http://${process.env.ELASTIC_AUTH}@${process.env.ELASTIC_HOST}:${
        process.env.ELASTIC_PORT
      }`
    }
  },
  /**
   * Service Mixins
   */
  mixins: [ESService],

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
    createOrder: {
      auth: 'Bearer',
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
            const [instance] = await ctx.call('stores.findInstance', {
              consumerKey: ctx.meta.user
            });
            if (
              !instance.address ||
              !instance.address.first_name ||
              !instance.address.last_name ||
              !instance.address.address_1 ||
              !instance.address.country ||
              !instance.address.email
            )
              throw new MoleculerClientError('No Billing Address Or Address Missing Data!');
            const orderItems = data.items.map(item => item.sku);
            const products = await ctx.call('orders.search', {
              index: 'products',
              type: 'Product',
              body: {
                query: {
                  bool: {
                    filter: [
                      {
                        nested: {
                          path: 'variations',
                          query: {
                            bool: {
                              filter: {
                                terms: {
                                  'variations.sku': orderItems
                                }
                              }
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            });
            const found = [];
            products.hits.hits.forEach(product =>
              found.push(
                ...product._source.variations
                  .filter(variation => orderItems.includes(variation.sku))
                  .map(item => ({ sku: item.sku, quantity: item.quantity }))
              )
            );
            const inStock = found.filter(item => item.quantity > 0);
            if (inStock.length === 0)
              return {
                warning: {
                  message:
                    'The products you ordered is not in-stock, The order has not been created!',
                  code: 1101
                }
              };
            data.items = data.items.filter(item => inStock.map(i => i.sku).includes(item.sku));
            data.billing = {
              first_name: instance.address.first_name,
              last_name: instance.address.last_name,
              company: instance.company ? instance.company : '',
              address_1: instance.address.address_1,
              address_2: instance.address.address_2 ? instance.address.address_2 : '',
              city: instance.address.city ? instance.address.city : '',
              state: instance.address.state ? instance.address.state : '',
              postcode: instance.address.postcode ? instance.address.postcode : '',
              country: instance.address.country,
              phone: instance.address.phone ? instance.address.phone : '',
              email: instance.address.email
            };
            const result = await ctx.call('klayer.createOrder', {
              order: data
            });
            const order = result.data;
            this.broker.cacher.clean(`orders.list:${ctx.meta.user}**`);
            const message = {
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
            const outOfStock = orderItems.filter(item => !inStock.map(i => i.sku).includes(item));
            if (outOfStock.length > 0)
              message.warning = {
                message: `This items are out of stock ${outOfStock}`,
                skus: outOfStock,
                code: 1102
              };
            return message;
          } catch (err) {
            throw new MoleculerClientError(err, 500);
          }
        } else {
          throw new MoleculerClientError('User not authenticated');
        }
      }
    },

    getOrder: {
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
        keys: ['#user', 'page', 'limit'],
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

    updateOrder: {
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
              this.broker.cacher.clean(`orders.list:${ctx.meta.user}**`);
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
          this.broker.cacher.clean(`orders.list:${ctx.meta.user}**`);
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
    deleteOrder: {
      auth: 'Bearer',
      params: {
        id: { type: 'string', convert: true }
      },
      handler(ctx) {
        return ctx
          .call('klayer.deleteOrder', { id: ctx.params.id })
          .then(() => {
            this.broker.cacher.clean(`orders.list:${ctx.meta.user}**`);
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
