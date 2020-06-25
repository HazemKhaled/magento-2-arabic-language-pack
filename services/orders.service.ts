import { Context, ServiceSchema } from 'moleculer';
import { v1 as uuidv1 } from 'uuid';

import { Log, OrderOMSResponse, Order, OrderAddress, OrderItem, Product, Store } from '../utilities/types';
import TaxCheck = require('../utilities/mixins/tax.mixin');
import { Mail, Oms, OrdersOperations, OrdersOpenapi, OrdersValidation } from '../utilities/mixins';
import { MpError } from '../utilities/adapters';

const TheService: ServiceSchema = {
  name: 'orders',
  mixins: [OrdersOperations, OrdersValidation, OrdersOpenapi, TaxCheck, Mail, Oms],
  settings: {
    BASEURL:
      process.env.NODE_ENV === 'production'
        ? 'https://mp.knawat.io/api'
        : 'https://dev.mp.knawat.io/api',
  },
  actions: {
    createOrder: {
      auth: 'Bearer',
      async handler(ctx: Context) {
        let warnings: { code: number; message: string; }[] = []; // Initialize warnings array
        // Get the Store instance
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user,
        });

        // create OMS contact if no oms ID
        if (!instance.internal_data || !instance.internal_data.omsId) {
          await this.setOmsId(instance);
        }

        const data = this.orderData(ctx.params, instance, true);

        this.sendLogs({
          topic: 'order',
          topicId: data.externalId,
          message: 'Order Received!',
          storeId: instance.url,
          logLevel: 'info',
          code: 100,
          payload: {
            params: ctx.params,
          },
        });
        // Check the available products and quantities return object with inStock products info
        const stock: {
          products: Product[];
          inStock: OrderItem[];
          enoughStock: OrderItem[];
          items: OrderItem[];
          orderItems: string[];
          outOfStock: OrderItem[];
          notEnoughStock: OrderItem[];
          notKnawat: OrderItem[];
        } = await this.stockProducts(data.items);

        // Return warning response if no Item available
        if (stock.items.length === 0) {
          this.sendLogs({
            topicId: data.externalId,
            message:
              'The products you ordered are not Knawat products, The order has not been created!',
            storeId: instance.url,
            logLevel: 'warn',
            code: 1101,
            payload: {
              errors: {
                products: stock.notKnawat,
              },
              params: ctx.params,
            },
          });

          throw new MpError('Orders Service', 'The products you ordered are not Knawat products, The order has not been created!', 404);
        }

        // Taxes
        const taxData = await this.setTaxIds(instance, stock.items);
        const taxesMsg: { code: number; message: string; }[] = taxData.msgs;

        // Update Order Items
        data.items = taxData.items;
        data.isInclusiveTax = taxData.isInclusive;
        const { taxTotal } = taxData;

        // Shipping
        const shipment = await this.shipment(
          stock.items,
          ctx.params.shipping.country,
          instance,
          ctx.params.shipping_method,
        );

        if (!shipment) {
          this.sendLogs({
            topicId: data.externalId,
            message: `We don't shipment to ${ctx.params.shipping.country}`,
            storeId: instance.url,
            logLevel: 'error',
            code: 400,
            payload: {
              errors: {
                data: shipment,
              },
              params: ctx.params,
            },
          });

          throw new MpError('Orders Service', 'Sorry the order is not created as there is no shipment method to your country!', 400);
        }

        data.shipmentCourier = shipment.courier;
        data.shippingCharge = shipment.cost;

        // Calculate the order total
        const total: number =
          data.items.reduce(
            (accumulator: number, current: OrderItem) => accumulator + current.rate * current.quantity,
            0,
          ) + (data.isInclusiveTax ? 0 : taxTotal);

        // Getting the current user subscription
        const subscription = await ctx.call('subscription.sGet', { id: instance.url });
        switch (subscription.attributes.orderProcessingType) {
        case '$':
          data.adjustment = Number(subscription.attributes.orderProcessingFees);
          data.adjustmentDescription = 'Processing Fees';
          break;
        case '%':
          data.adjustment = (Number(subscription.attributes.orderProcessingFees) / 100) * total;
          data.adjustmentDescription = `Processing Fees ${
            subscription.attributes.orderProcessingFees
          }%`;
          break;
        }

        const orderExpenses = {
          total,
          shipping: data.shippingCharge,
          tax: taxTotal,
          adjustment: data.adjustment,
        };

        const discountResponse: { warnings?: [], discount?: number; coupon: string; } = await this.discount({
          code: ctx.params.coupon,
          membership: subscription.membership.id,
          orderExpenses,
          isValid: true,
          isAuto: !ctx.params.coupon,
        });
        if (Array.isArray(discountResponse) && ctx.params.coupon) {
          warnings = warnings.concat(discountResponse.warnings);
        }
        if (discountResponse && discountResponse.discount) {
          data.discount = discountResponse.discount.toString();
          data.coupon = discountResponse.coupon;
        }

        // Checking for processing fees
        this.sendLogs({
          topic: 'order',
          topicId: data.externalId,
          message: `Subscription Package: ${subscription ? subscription.membership.name.en : 'Free'}`,
          storeId: instance.url,
          logLevel: 'info',
          code: 2103,
          payload: { subscription, params: ctx.params },
        });

        data.status = ['pending', 'processing', 'cancelled'].includes(data.status)
          ? this.normalizeStatus(data.status)
          : data.status;
        data.subscription = subscription.membership.name.en;

        // Initializing warnings array if we have a Warning
        warnings = warnings.concat(this.warningsMessenger(
          stock.outOfStock,
          stock.notEnoughStock,
          data,
          instance,
          ctx.params.shipping_method,
          ctx.params.shipping,
          shipment,
          ctx.params,
        ));
        warnings = warnings.concat(taxesMsg);

        if (warnings.length) {
          data.warnings = JSON.stringify(warnings);
        }

        const result: OrderOMSResponse = await ctx.call('oms.createNewOrder', data);
        if (!result.salesorder) {
          this.sendLogs({
            topicId: data.externalId,
            message: result.error.message,
            storeId: instance.url,
            logLevel: 'error',
            code: result.error.statusCode,
            payload: {
              errors: (result.error && result.error.details) || result,
              params: ctx.params,
            },
          });
          ctx.meta.$statusCode = result.error.statusCode;
          ctx.meta.$statusMessage = result.error.name;
          return {
            errors: [
              {
                status: 'fail',
                message: result.error.details || result.error.message,
              },
            ],
          };
        }
        if (result.salesorder && !(instance.internal_data && instance.internal_data.omsId)) {
          ctx
            .call('stores.update', {
              id: instance.url,
              internal_data: {
                omsId: result.salesorder.store.id,
              },
            })
            .then(r => this.logger.info(r));
        }

        // If coupon used update quantity
        if (data.coupon) {
          ctx.call('coupons.updateCount', { id: data.coupon });
        }

        // Update CRM last update
        ctx.call('crm.updateStoreById', { id: instance.url, last_order_date: Date.now() });

        // Update products sales quantity
        ctx.call('products.updateQuantityAttributes', {
          products: stock.products.map((product: Product) => ({
            id: product.sku,
            qty: product.sales_qty + 1 || 1,
            attribute: 'sales_qty',
          })),
        });

        /* Prepare the response message in case of success or warnings */
        const order = result.salesorder;

        // Clearing order list action(API) cache
        await this.broker.cacher.clean(`orders.list:undefined|${ctx.meta.user}**`);
        this.cacheUpdate(order, instance);

        const message: {
          status?: string;
          data?: OrderOMSResponse['salesorder'] | any; // Remove any after
          warnings?: Array<{}>;
          errors?: Array<{}>;
        } = {
          status: 'success',
          data: this.sanitizeResponseOne(order),
        };

        if (warnings.length) {
          this.sendMail({
            to: process.env.SUPPORT_MAIL,
            subject: 'Order Warnings',
            text: `${warnings.reduce((a, o) => `${a}${o.message}\n`, 'OrderID: ${order.id}\n')}`,
          });
        }

        if (order.id && order.status === 'open' && !warnings.length) {
          setTimeout(
            (instanceCopy, orderCopy) => {
              ctx
                .call('invoices.createOrderInvoice', {
                  storeId: instanceCopy.url,
                  orderId: orderCopy.id,
                })
                .then(res =>
                  ctx.call('invoices.markInvoiceSent', {
                    omsId: instanceCopy.internal_data.omsId,
                    invoiceId: res.invoice.invoiceId,
                  }),
                )
                .then(
                  () => {
                    order.status = 'invoiced';
                    this.cacheUpdate(order, instance);
                    this.broker.cacher.clean(`invoices.get:${instanceCopy.consumer_key}*`);
                  },
                  this.logger.error,
                );
            },
            5000,
            instance,
            order,
          );
        }

        if (warnings.length > 0) message.warnings = warnings;
        this.sendLogs({
          topicId: data.externalId,
          message: 'Order created successfully',
          storeId: instance.url,
          logLevel: 'info',
          code: 200,
        });
        return message;
      },
    },
    updateOrder: {
      auth: 'Bearer',
      async handler(ctx) {
        let warnings: { code: number; message: string; }[] = []; // Initialize warnings array
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user,
        });
        this.sendLogs({
          topic: 'order',
          topicId: ctx.params.id,
          message: 'Cancel Order Received!',
          storeId: instance.url,
          logLevel: 'info',
          code: 100,
          payload: {
            params: ctx.params,
          },
        });
        const orderBeforeUpdate = await ctx.call('orders.getOrder', { order_id: ctx.params.id });
        if (orderBeforeUpdate.id === -1) {
          ctx.meta.$statusCode = 404;
          ctx.meta.$statusMessage = 'Not Found';
          return { message: 'Order Not Found!' };
        }
        // Change here
        if (!['Order Placed', 'Processing'].includes(orderBeforeUpdate.status)) {
          ctx.meta.$statusCode = 405;
          ctx.meta.$statusMessage = 'Not Allowed';
          return { message: 'The Order Is Now Processed With Knawat You Can Not Update It' };
        }
        if ('Cancelled' === orderBeforeUpdate.status) {
          return { message: 'The Order Is Cancelled, You Can Not Update It' };
        }

        const data = this.orderData(ctx.params);
        if (data.shipping) data.shipping = this.normalizeAddress(data.shipping);

        data.status = this.normalizeUpdateRequestStatus(data.status);
        // Change
        if (data.status === 'cancelled' || data.status === 'void') {
          return ctx.call('orders.delete', { id: data.id }).then(res => {
            this.broker.cacher.clean(`orders.list:undefined|${ctx.meta.user}**`);
            this.broker.cacher.clean(`orders.getOrder:${ctx.params.id}**`);
            return res;
          });
        }

        const message: {
          status?: string;
          data?: OrderOMSResponse['salesorder'] | any; // Remove any after
          warnings?: Array<{}>;
          errors?: Array<{}>;
        } = {};
        let shipment: any = 'No Items';

        try {
          if (ctx.params.items) {
            // Check the available products and quantities return object with inStock products info
            const stock = await this.stockProducts(data.items);
            // Return error response if no Item available
            if (stock.enoughStock.length === 0) {
              this.sendLogs({
                topicId: orderBeforeUpdate.externalId,
                message:
                  'The products you ordered are not Knawat products, The order has not been created!',
                storeId: instance.url,
                logLevel: 'warn',
                code: 1101,
                payload: {
                  errors: {
                    products: stock.notKnawat,
                  },
                  params: ctx.params,
                },
              });
              ctx.meta.$statusCode = 404;
              ctx.meta.$statusMessage = 'Not Found';
              return {
                errors: [
                  {
                    status: 'fail',
                    message:
                      'The products you ordered are not Knawat products, The order has not been created!',
                    code: 1101,
                  },
                ],
              };
            }

            // Get Shipping Country
            let country = orderBeforeUpdate.shipping.country;
            if (ctx.params.shipping && ctx.params.shipping.country) {
              country = ctx.params.shipping.country;
            }

            // Taxes
            const taxData = await this.setTaxIds(instance, stock.items);
            const taxesMsg: { code: number; message: string; }[] = taxData.msgs;
            const { taxTotal } = taxData;

            // Update Order Items
            data.items = taxData.items;
            data.isInclusiveTax = taxData.isInclusive;

            // Shipping
            shipment = await this.shipment(
              stock.items,
              country,
              instance,
              ctx.params.shipping_method,
            );

            if (shipment) {
              data.shipmentCourier = shipment.courier;
              data.shippingCharge = shipment.cost;
            }
            // Calculate the order total
            const total: number =
              data.items.reduce(
                (accumulator: number, current: OrderItem) => accumulator + current.purchaseRate * current.quantity,
                0,
              ) + (data.isInclusiveTax ? 0 : taxTotal);

            // Getting the current user subscription
            const subscription = await ctx.call('subscription.sGet', { id: instance.url });
            if (subscription.attributes.orderProcessingType === '%') {
              subscription.adjustment = (subscription.attributes.orderProcessingFees / 100) * total;
              subscription.adjustmentDescription = `Processing Fees ${
                subscription.attributes.orderProcessingFees
              }%`;
            }

            const orderExpenses = {
              total,
              shipping: data.shippingCharge,
              tax: taxTotal,
              adjustment: data.adjustment,
            };
            if (orderBeforeUpdate.coupon) {
              const discountResponse: { warnings?: [], discount?: number } = await this.discount({
                code: orderBeforeUpdate.coupon,
                membership: subscription.membership.id,
                orderExpenses,
              });
              if (Array.isArray(discountResponse)) {
                warnings = warnings.concat(discountResponse.warnings);
              } else {
                data.discount = discountResponse.discount.toString();
              }
            }

            // Initializing warnings array if we have a Warning
            warnings = warnings.concat(this.warningsMessenger(
              stock.outOfStock,
              stock.notEnoughStock,
              data,
              instance,
              ctx.params.shipping_method,
              ctx.params.shipping,
              shipment,
              ctx.params,
            ));
            warnings = warnings.concat(taxesMsg);

            if (warnings.length) {
              let parsedOldWarnings = [];
              try {
                parsedOldWarnings = JSON.parse(orderBeforeUpdate.warnings);
              } catch(e) {}
              data.warnings = JSON.stringify(warnings.concat(parsedOldWarnings));
            }
          }
          // Convert status
          data.status = ['pending', 'processing', 'cancelled'].includes(data.status)
            ? this.normalizeStatus(data.status)
            : data.status;
          // Update order
          const result: OrderOMSResponse = await ctx.call('oms.updateOrderById', {
            customerId: instance.internal_data.omsId,
            orderId: ctx.params.id,
            ...data,
          });

          if (!result.salesorder) {
            this.sendLogs({
              topicId: orderBeforeUpdate.externalId,
              message: result.error.message,
              storeId: instance.url,
              logLevel: 'error',
              code: result.error.statusCode,
              payload: {
                errors: (result.error && result.error.details) || result,
                params: ctx.params,
              },
            });
            ctx.meta.$statusCode = result.error.statusCode;
            ctx.meta.$statusMessage = result.error.name;
            return {
              errors: [
                {
                  status: 'fail',
                  message: result.error.details || result.error.message,
                },
              ],
            };
          }
          const order = result.salesorder;
          await this.broker.cacher.clean(`orders.list:undefined|${ctx.meta.user}**`);
          this.cacheUpdate(order, instance);
          message.status = 'success';
          message.data = this.sanitizeResponseOne(order);
          if (warnings.length > 0) message.warnings = warnings;
          this.sendLogs({
            topicId: data.externalId,
            message: 'Order updated successfully',
            storeId: instance.url,
            logLevel: 'info',
            code: 200,
          });
          return message;
        } catch (err) {
          this.logger.error(err);
          this.sendLogs({
            topicId: orderBeforeUpdate.externalId,
            message: err && err.stack || (err.error && err.error.message) ? err.error.message : 'Order Error',
            storeId: instance.url,
            logLevel: 'error',
            code: 500,
            payload: { errors: err.error || err.stack, params: ctx.params },
          });
          ctx.meta.$statusCode = 500;
          ctx.meta.$statusMessage = 'Internal Server Error';
          return {
            errors: [
              {
                status: 'fail',
                message: 'Internal Server Error',
              },
            ],
          };
        }
      },
    },
    getOrder: {
      auth: 'Bearer',
      cache: {
        keys: ['order_id'],
        ttl: 60 * 60 * 24, // 1 hour
      },
      async handler(ctx) {
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user,
        });
        if (!(instance.internal_data && instance.internal_data.omsId)) {
          ctx.meta.$statusCode = 404;
          ctx.meta.$statusMessage = 'Not Found';
          return {
            message: 'There is no orders for this store!',
          };
        }

        let order = await ctx.call('oms.getOrderById', {
          customerId: instance.internal_data.omsId,
          orderId: ctx.params.order_id,
        });
        if (order.error) {
          if (order.error.statusCode === 404) {
            ctx.meta.$statusCode = 404;
            ctx.meta.$statusMessage = 'Not Found';
            return {
              message: 'Order Not Found!',
            };
          }
          ctx.meta.$statusCode = 400;
          ctx.meta.$statusMessage = 'Bad Request';
          return {
            message: 'There is an error',
          };
        }

        return this.sanitizeResponseOne(order.salesorder);
      },
    },
    list: {
      auth: 'Bearer',
      cache: {
        keys: ['externalId', '#user', 'limit', 'page', 'sort', 'sortOrder', 'status', 'timestamp'],
        ttl: 60 * 60 * 24,
      },
      async handler(ctx) {
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user,
        });
        if (!(instance.internal_data && instance.internal_data.omsId)) {
          return [];
        }
        const queryParams: { [key: string]: string } = {};
        if (ctx.params.limit) queryParams.perPage = ctx.params.limit;
        const keys = [
          'page',
          'sort',
          'sortOrder',
          'status',
          'externalId',
          'date',
          'dateStart',
          'dateEnd',
          'dateAfter',
          'shipmentDate',
          'shipmentDateStart',
          'shipmentDateEnd',
          'shipmentDateBefore',
          'shipmentDateAfter',
        ];
        Object.keys(ctx.params).forEach(key => {
          if (!keys.includes(key)) return;
          queryParams[key] = ctx.params[key];
        });
        const orders = await ctx.call('oms.listOrders', {
          customerId: instance.internal_data.omsId,
          ...queryParams,
        });
        return this.sanitizeResponseList(orders.salesorders);
      },
    },
    deleteOrder: {
      auth: 'Bearer',
      async handler(ctx) {
        const orderBeforeUpdate = await ctx.call('orders.getOrder', { order_id: ctx.params.id });
        if (orderBeforeUpdate.id === -1) {
          ctx.meta.$statusCode = 404;
          ctx.meta.$statusMessage = 'Not Found';
          return { message: 'Order Not Found!' };
        }
        // Change here
        //FIXME: Allow cancel order if invoice not paid
        if (!['Order Placed', 'Processing'].includes(orderBeforeUpdate.status)) {
          ctx.meta.$statusCode = 405;
          ctx.meta.$statusMessage = 'Not Allowed';
          return { message: 'The Order Is Now Processed With Knawat You Can Not Cancel It' };
        }
        if ('Cancelled' === orderBeforeUpdate.status) {
          return { message: 'The Order Is Already Cancelled' };
        }
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user,
        });
        this.sendLogs({
          topic: 'order',
          topicId: ctx.params.id,
          message: 'Cancel Order Received!',
          storeId: instance.url,
          logLevel: 'info',
          code: 100,
          payload: {
            params: ctx.params,
          },
        });
        return ctx
          .call('oms.deleteOrderById', {
            customerId: instance.internal_data.omsId,
            orderId: ctx.params.id,
          })
          .then(
            async result => {
              this.broker.cacher.clean(`orders.list:undefined|${ctx.meta.user}**`);
              this.broker.cacher.clean(`orders.getOrder:${ctx.params.id}**`);
              if (result.salesorder) {
                return {
                  status: 'success',
                  data: {
                    order_id: ctx.params.id,
                  },
                };
              }

              this.logger.error(result);

              this.sendLogs({
                topicId: ctx.params.id,
                message:
                  result && result.error && result.error.message
                    ? result.error.message
                    : 'Order Error',
                storeId: instance.url,
                logLevel: 'error',
                code: 500,
                payload: { errors: result.error || result, params: ctx.params },
              });
              ctx.meta.$statusCode = 500;
              ctx.meta.$statusMessage = 'Internal Server Error';
              return {
                errors: [
                  {
                    status: 'fail',
                    message: 'Internal Server Error',
                  },
                ],
              };
            },
            err => {
              this.sendLogs({
                topicId: ctx.params.id,
                message: err && err.error && err.error.message ? err.error.message : 'Order Error',
                storeId: instance.url,
                logLevel: 'error',
                code: 500,
                payload: { errors: err.error || err, params: ctx.params },
              });
              ctx.meta.$statusCode = 500;
              ctx.meta.$statusMessage = 'Internal Server Error';
              return {
                errors: [
                  {
                    status: 'fail',
                    message: 'Internal Server Error',
                  },
                ],
              };
            },
          );
      },
    },
  },
  methods: {
    /**
     * Convert order status from MP status to OMS status
     *
     * @param {string} status
     * @returns
     */
    normalizeStatus(status: string) {
      switch (status) {
      case 'pending':
        status = 'draft';
        break;
      case 'processing':
        status = 'open';
        break;
      case 'cancelled':
        status = 'void';
        break;
      default:
        status = 'draft';
      }
      return status;
    },
    /**
     * Convert order status from OMS status to ZApp status
     *
     * @param {string} status
     * @returns
     */
    normalizeResponseStatus(status: string) {
      switch (status) {
      case 'draft':
        status = 'Order Placed';
        break;
      case 'open':
        status = 'Processing';
        break;
      case 'void':
        status = 'Cancelled';
        break;
      }
      return status;
    },
    /**
     * Convert order status from ZApp status to OMS Status
     *
     * @param {string} status
     * @returns
     */
    normalizeUpdateRequestStatus(status: string) {
      switch (status) {
      case 'Order Placed':
        status = 'draft';
        break;
      case 'Processing':
        status = 'open';
        break;
      case 'Cancelled':
        status = 'void';
        break;
      }
      return status;
    },
    /**
     * Clean any empty fields in OrdersAddress
     *
     * @param {*} address
     * @returns {OrderAddress}
     */
    normalizeAddress(address): OrderAddress {
      Object.keys(address).forEach(key => {
        if (address[key] === '' || undefined) delete address[key];
      });
      return address;
    },
    /**
     * Log order errors
     *
     * @param {Log} log
     * @returns {ServiceSchema}
     */
    sendLogs(log: Log): ServiceSchema {
      log.topic = 'order';
      return this.broker.call('logs.add', log);
    },
    /**
     * Inspect order warning into order body
     *
     * @param {*} outOfStock
     * @param {*} notEnoughStock
     * @param {*} data
     * @param {*} instance
     * @param {*} shippingMethod
     * @param {*} shipping
     * @param {*} shipment
     * @returns
     */
    warningsMessenger(
      outOfStock: OrderItem[],
      notEnoughStock: OrderItem[],
      data,
      instance,
      shippingMethod,
      shipping,
      shipment,
      params,
    ) {
      const warnings = [];
      try {
        if (outOfStock.length > 0) {
          warnings.push({
            message: `${outOfStock.reduce(
              (accumulator, item) =>
                `${accumulator}${accumulator && '\n'}SKU: ${item.sku} Required Qty: ${
                  item.quantityRequired
                } Available Qty: ${item.quantity}`,
              '',
            )}`,
            skus: outOfStock.map(e => e.sku),
            code: 1102,
          });
          this.sendLogs({
            topic: 'order',
            topicId: data.externalId,
            message: 'Some products are out of stock',
            storeId: instance.url,
            logLevel: 'warn',
            code: 1102,
            payload: { outOfStock, params },
          });
        }
        if (notEnoughStock.length > 0) {
          warnings.push({
            message: `${notEnoughStock.reduce(
              (accumulator, item) =>
                `${accumulator}${accumulator && '\n'}SKU: ${item.sku} Required Qty: ${
                  item.quantityRequired
                } Available Qty: ${item.quantity}`,
              '',
            )}`,
            skus: notEnoughStock.map(e => e.sku),
            code: 1103,
          });
          this.sendLogs({
            topic: 'order',
            topicId: data.externalId,
            message: 'This items quantities are not enough stock',
            storeId: instance.url,
            logLevel: 'warn',
            code: 1103,
            payload: { outOfStock, params },
          });
        }
        if ((!instance.shipping_methods || !instance.shipping_methods[0].name) && !shippingMethod) {
          this.sendLogs({
            topic: 'order',
            topicId: data.externalId,
            message: `There is no default shipping method for your store, It’ll be shipped with ${shipment.courier ||
              'Standard'}`,
            storeId: instance.url,
            logLevel: 'warn',
            code: 2102,
            payload: { shipment, params },
          });
        }
        if (
          (shipment.courier !== shippingMethod && shippingMethod) ||
          (instance.shipping_methods &&
            instance.shipping_methods[0].name &&
            shipment.courier !== instance.shipping_methods[0].name)
        ) {
          this.sendLogs({
            topic: 'order',
            topicId: data.externalId,
            message: `Can’t ship to ${
              shipping.country
            } with provided courier, It’ll be shipped with ${shipment.courier ||
              'Standard'}, Contact our customer support for more info`,
            storeId: instance.url,
            logLevel: 'warn',
            code: 2101,
            payload: { shipment, params },
          });
        }
        if (!this.checkAddress(instance, data.externalId)) {
          warnings.push({
            message: 'Billing address not found',
            code: 1104,
          });
        }
      } catch (err) {
        this.logger.error(err);
      }
      return warnings;
    },
    /**
     * Transform order to OMS format
     *
     * @param {Order} params
     * @returns
     */
    orderData(params: Order, instance: Store, create = false) {
      const data: Order = {
        status: params.status,
        items: params.items || params.line_items,
        shipping: params.shipping,
        notes: params.notes,
        shipping_method: params.shipping_method || params.shipmentCourier,
      };
      if (create) {
        data.externalId = params.id ? String(params.id) : uuidv1();
        data.externalInvoice =
          params.invoice_url ||
          `${this.settings.BASEURL}/invoice/${encodeURIComponent(instance.url)}/external/${
            data.externalId
          }`;
        // Order store data
        data.store =
          instance.internal_data && instance.internal_data.omsId
            ? { id: instance.internal_data.omsId }
            : {
              url: instance.url,
              name: instance.name,
              users: instance.users,
            };
        if (instance.logo) {
          data.storeLogo = instance.logo;
        }
      }
      return data;
    },
    checkAddress(instance, externalId) {
      if (
        !instance.address ||
        !instance.address.first_name ||
        !instance.address.last_name ||
        !instance.address.address_1 ||
        !instance.address.country ||
        !instance.address.email
      ) {
        this.sendLogs({
          topic: 'order',
          topicId: externalId,
          message: 'No Billing Address Or Address Missing Data.',
          storeId: instance.url,
          logLevel: 'warn',
          code: 1104,
        });
        return false;
      }
      return true;
    },
    async setTaxIds(instance, items) {
      const taxesMsg: {}[] = [];
      let isInclusive = false;
      let taxTotal = 0;
      const itemsAfterTaxes = await Promise.all(
        items.map(
          async (item: OrderItem) => {
            const taxData = await this.getItemTax(instance, item);

            if (!isInclusive) {
              isInclusive = taxData.isInclusive;
            }

            // delete taxClass attr.
            delete item.taxClass;

            if (taxData.name) {
              item.taxId = taxData.omsId;
            }

            if (taxData.code) {
              taxesMsg.push(taxData);
            }

            if (taxData.percentage) {
              taxTotal += item.rate / 100 * taxData.percentage;
            }

            return item;
          }));
      return {
        items: itemsAfterTaxes,
        isInclusive,
        msgs: taxesMsg,
        taxTotal,
      };
    },
    sanitizeResponseOne(order): Order {
      const orderResponse: {[key: string]: any} = {
        id: order.id,
        status: this.normalizeResponseStatus(order.status),
        items: order.items,
        billing: order.billing,
        shipping: order.shipping,
        total: order.total,
        coupon: order.coupon,
        discount: order.discount,
        externalId: order.externalId,
        createDate: order.createDate,
        updateDate: order.updateDate,
        knawat_order_status: order.status ? this.normalizeResponseStatus(order.status) : '',
        notes: order.notes,
        shipping_method: order.shipmentCourier,
        shipping_charge: order.shippingCharge,
        shipment_date: order.shipmentDate,
        adjustment: order.adjustment,
        adjustmentDescription: order.adjustmentDescription,
        shipment_tracking_number: order.shipmentTrackingNumber,
        orderNumber: order.orderNumber,
        invoice_url: order.externalInvoice,
        taxTotal: order.taxTotal,
        taxes: order.taxes,
        warnings: order.warnings,
      };
      if (order.meta_data && order.meta_data.length > 0) {
        order.meta_data.forEach((meta: any) => {
          if (
            meta.key === '_shipment_tracking_number' ||
            meta.key === '_shipment_provider_name' ||
            meta.key === '_knawat_order_status'
          ) {
            orderResponse[meta.key.substring(1)] = meta.value || '';
            if (meta.key === '_knawat_order_status') {
              orderResponse[meta.key.substring(1)] =
                this.normalizeResponseStatus(meta.value) || '';
            }
          }
        });
      }
      return orderResponse as Order;
    },
    sanitizeResponseList(orders) {
      return orders.map((order: Order) => ({
        id: order.id,
        externalId: order.externalId,
        status: this.normalizeResponseStatus(order.status),
        createDate: order.createDate,
        updateDate: order.updateDate,
        total: order.total,
        trackingNumber: order.shipmentTrackingNumber,
        shipment_date: order.shipmentDate,
        knawat_order_status: order.status ? this.normalizeResponseStatus(order.status) : '',
        orderNumber: order.orderNumber,
        invoice_url: order.externalInvoice,
      }));
    },
    async cacheUpdate(order, instance) {
      this.broker.cacher.set(`orders.getOrder:${order.id}`, this.sanitizeResponseOne(order));
      this.broker.cacher.set(`orders.list:${order.externalId}|${instance.consumer_key}|undefined|undefined|undefined|undefined|undefined`, this.sanitizeResponseList([order]));
    },
  },
};

export = TheService;
