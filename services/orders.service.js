const uuidv1 = require('uuid/v1');
const fetch = require('node-fetch');
const { MoleculerClientError } = require('moleculer').Errors;
const { OrdersOperations } = require('../utilities/mixins/orders.mixin');

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
  notes: { type: 'string', optional: true },
  shipping_method: { type: 'string', optional: true }
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
   * Service metadata
   */
  metadata: {
    entityValidator
  },
  mixins: [OrdersOperations],
  settings: {
    app_url:
      process.env.NODE_ENV === 'development'
        ? 'https://dev.app.knawat.com'
        : 'https://app.knawat.com'
  },

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
        if (ctx.params.shipping.company !== 'ebay') ctx.params.id = uuidv1();
        try {
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
          ) {
            ctx.meta.$statusCode = 428;
            ctx.meta.$statusMessage = 'Missing billing data';
            return {
              errors: [
                {
                  status: 'fail',
                  message: 'No Billing Address Or Address Missing Data. Your order failed!',
                  solution: `Please fill on your store billing address from here: ${
                    this.settings.app_url
                  }/stores/settings/${encodeURIComponent(encodeURIComponent(instance.url))}`
                }
              ]
            };
          }

          // Check the available products and quantities return object with inStock products info
          const stock = await this.stockProducts(data.items);
          // Return warning response if no Item available
          if (stock.enoughStock.length === 0) {
            ctx.meta.$statusCode = 404;
            ctx.meta.$statusMessage = 'Not Found';
            return {
              errors: [
                {
                  status: 'fail',
                  message:
                    'The products you ordered is not in-stock, The order has not been created!',
                  code: 1101
                }
              ]
            };
          }
          // Update Order Items
          data.items = stock.items;

          // Shipping
          const shipment = await this.shipment(
            stock.products,
            stock.enoughStock,
            ctx.params.shipping.country,
            instance,
            ctx.params.shipping_method
          );

          // Getting the current user subscription
          const subscription = this.currentSubscriptions(instance);

          // Checking for processing fees
          if (
            subscription.attr_order_processing_fees &&
            subscription.attr_order_processing_fees > 0
          )
            data.items.push({
              sku: 'PROCESSING-FEE',
              quantity: 1
            });

          // Prepering billing data
          data.billing = {
            first_name: instance.address.first_name,
            last_name: instance.address.last_name,
            company: instance.company || '',
            address_1: instance.address.address_1,
            address_2: instance.address.address_2 || '',
            city: instance.address.city || '',
            state: instance.address.state || '',
            postcode: instance.address.postcode || '',
            country: instance.address.country,
            phone: instance.address.phone || '',
            email: instance.address.email
          };

          // Send the order to klayer
          const result = await ctx.call('klayer.createOrder', {
            order: data,
            shipment: shipment
          });

          // Clearing order list action(API) cache
          this.broker.cacher.clean(`orders.list:${ctx.meta.user}**`);

          // Update products sales quantity
          ctx.call('products-list.updateQuantityAttributes', {
            products: stock.products.map(product => ({
              _id: product._id,
              qty: product._source.sales_qty || 0,
              attribute: 'sales_qty'
            }))
          });

          /* Prepare the response message in case of success or warnings */
          const order = result.data;
          const message = {
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
          const outOfStock = stock.orderItems.filter(
            item => !stock.inStock.map(i => i.sku).includes(item)
          );
          const notEnoughStock = stock.inStock.filter(
            item => !stock.enoughStock.map(i => i.sku).includes(item.sku)
          );

          // Intiallizing warnings array if we have a Warning
          if (outOfStock.length > 0 || notEnoughStock.length > 0) message.warnings = [];
          try {
            if (outOfStock.length > 0)
              message.warnings.push({
                message: `This items are out of stock ${outOfStock}`,
                skus: outOfStock,
                code: 1102
              });
            if (notEnoughStock.length > 0)
              message.warnings.push({
                message: `This items quantities are not enough stock ${outOfStock}`,
                skus: notEnoughStock,
                code: 1103
              });
            if (
              (!instance.shipping_methods || !instance.shipping_methods[0].name) &&
              !ctx.params.shipping_method
            ) {
              message.warnings.push({
                message: `There is no default shipping method for your store, It’ll be shipped with ${shipment.courier ||
                  'PTT'}, Contact our customer support for more info`,
                code: 2102
              });
            }
            if (
              (shipment.courier !== ctx.params.shipping_method && ctx.params.shipping_method) ||
              (instance.shipping_methods &&
                instance.shipping_methods[0].name &&
                shipment.courier !== instance.shipping_methods[0].name)
            ) {
              message.warnings.push({
                message: `Can’t ship to ${
                  ctx.params.shipping.country
                } with provided courier, It’ll be shipped with ${shipment.courier ||
                  'PTT'}, Contact our customer support for more info`,
                code: 2101
              });
            }
          } catch (err) {
            this.logger.error(err);
          }
          return message;
        } catch (err) {
          throw new MoleculerClientError(err, 500);
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
        page: {
          type: 'number',
          convert: true,
          integer: true,
          min: 1,
          optional: true
        }
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
        status: {
          type: 'enum',
          values: ['pending', 'processing', 'cancelled']
        },
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
        notes: { type: 'string', optional: true },
        shipping_method: { type: 'string', optional: true }
      },
      async handler(ctx) {
        try {
          const orderBeforeUpdate = await ctx.call('orders.getOrder', { order_id: ctx.params.id });
          if (orderBeforeUpdate.id === -1) {
            return { message: 'Order Not Found!' };
          }
          if (!['processing', 'pending'].includes(orderBeforeUpdate.status)) {
            return { message: 'The Order Is Now Processed With Knawat You Can Not Update It' };
          }
          const data = ctx.params;
          if (ctx.params.invoice_url) {
            data.pdf_invoice_url = ctx.params.invoice_url;
          }
          if (data.status === 'cancelled')
            return ctx.call('orders.delete', { id: data.id }).then(res => {
              this.broker.cacher.clean(`orders.list:${ctx.meta.user}**`);
              return res;
            });

          const message = {};
          let shipment = 'No Items';
          // If there is items
          if (ctx.params.items) {
            const [instance] = await ctx.call('stores.findInstance', {
              consumerKey: ctx.meta.user
            });
            // Check the available products and quantities return object with inStock products info
            const stock = await this.stockProducts(data.items);
            // Return warning response if no Item available
            if (stock.enoughStock.length === 0) {
              ctx.meta.$statusCode = 404;
              ctx.meta.$statusMessage = 'Not Found';
              return {
                errors: [
                  {
                    status: 'fail',
                    message:
                      'The products you ordered is not in-stock, The order has not been created!',
                    code: 1101
                  }
                ]
              };
            }
            // Update Order Items
            data.items = stock.items;

            // Get Shipping Country
            let country = orderBeforeUpdate.shipping.country;
            if (ctx.params.shipping && ctx.params.shipping.country) {
              country = ctx.params.shipping.country;
            }

            // Shipping
            shipment = await this.shipment(
              stock.products,
              stock.enoughStock,
              country,
              instance,
              ctx.params.shipping_method
            );

            // Prepare response message
            const outOfStock = stock.orderItems.filter(
              item => !stock.inStock.map(i => i.sku).includes(item)
            );
            const notEnoughStock = stock.inStock.filter(
              item => !stock.enoughStock.map(i => i.sku).includes(item.sku)
            );

            // Intiallizing warnings array if we have a Warning
            if (outOfStock.length > 0 || notEnoughStock.length > 0) message.warnings = [];
            try {
              if (outOfStock.length > 0)
                message.warnings.push({
                  message: `This items are out of stock ${outOfStock}`,
                  skus: outOfStock,
                  code: 1102
                });
              if (notEnoughStock.length > 0)
                message.warnings.push({
                  message: `This items quantities are not enough stock ${outOfStock}`,
                  skus: notEnoughStock,
                  code: 1103
                });
              if (
                (!instance.shipping_methods || !instance.shipping_methods[0].name) &&
                !ctx.params.shipping_method
              ) {
                message.warnings.push({
                  message: `There is no default shipping method for your store, It’ll be shipped with ${shipment.courier ||
                    'PTT'}, Contact our customer support for more info`,
                  code: 2102
                });
              }
              if (
                (shipment.courier !== ctx.params.shipping_method && ctx.params.shipping_method) ||
                (instance.shipping_methods &&
                  instance.shipping_methods[0].name &&
                  shipment.courier !== instance.shipping_methods[0].name)
              ) {
                message.warnings.push({
                  message: `Can’t ship to ${
                    ctx.params.shipping.country
                  } with provided courier, It’ll be shipped with ${shipment.courier ||
                    'PTT'}, Contact our customer support for more info`,
                  code: 2101
                });
              }
            } catch (err) {
              this.logger.error(err);
            }
          }
          // Update order
          const result = await ctx.call('klayer.updateOrder', {
            order: data,
            shipment: shipment
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

          message.status = 'success';
          message.data = {
            id: order.id,
            status: order.status,
            items: order.line_items,
            billing: order.billing,
            shipping: order.shipping,
            createDate: order.date_created
          };
          return message;
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
  methods: {
    async currentSubscriptions(instance) {
      // Getting the user Information to check subscription
      const [user] = await fetch(
        `${process.env.KLAYER_URL}/api/Partners?filter=${JSON.stringify({
          where: {
            contact_email: instance.users.filter(usr => usr.roles.includes('owner'))[0].email
          }
        })}&access_token=dbbf3cb7-f7ad-46ce-bee3-4fd7477951c4`,
        { method: 'get' }
      ).then(res => res.json());
      const max = [];
      let lastDate = new Date(0);
      user.subscriptions.forEach(subscription => {
        if (new Date(subscription.expire_date) > lastDate) {
          max.push(subscription);
          lastDate = new Date(subscription.expire_date);
        }
      });
      return max.pop();
    }
  }
};
