import { Context, GenericObject, ServiceSchema } from 'moleculer';
import { v1 as uuidv1 } from 'uuid';

import {
  Log,
  OrderOMSResponse,
  Order,
  OrderAddress,
  OrderItem,
  Product,
  Store,
} from '../utilities/types';
import {
  Mail,
  Oms,
  OrdersOperations,
  OrdersOpenapi,
  OrdersValidation,
} from '../utilities/mixins';
import { MpError } from '../utilities/adapters';
import { TaxCheck } from '../utilities/mixins/tax.mixin';

const TheService: ServiceSchema = {
  name: 'orders',
  mixins: [
    OrdersOperations,
    OrdersValidation,
    OrdersOpenapi,
    TaxCheck,
    Mail,
    Oms,
  ],
  settings: {
    BASEURL:
      process.env.NODE_ENV === 'production'
        ? 'https://mp.knawat.io/api'
        : 'https://dev.mp.knawat.io/api',
  },
  actions: {
    createOrder: {
      auth: ['Bearer'],
      async handler(ctx: Context) {
        // Initialize warnings array
        let warnings: { code: number; message: string }[] = [];

        // Get the Store instance
        const { store } = ctx.meta;

        // TODO: Move to hook before create order, invoice or payment, and write this code into OMS service
        // create OMS contact if no oms ID
        if (!store.internal_data?.omsId) {
          await this.setOmsId(store);
        }

        // De-duplicate
        if (ctx.params.id) {
          const isCreated = await this.broker.cacher.get(
            `createOrder_${store.consumer_key}|${ctx.params.id}`
          );
          if (isCreated) {
            this.sendLogs({
              topic: 'order',
              topicId: ctx.params.id,
              message: 'We already received this order before!',
              storeId: store.url,
              logLevel: 'warn',
              code: 409,
              payload: {
                params: ctx.params,
              },
            });

            const orders = await ctx.call('orders.list', {
              externalId: ctx.params.id,
            });

            return {
              status: 'success',
              message: 'We already received this order before!',
              data: orders?.[0],
            };
          }

          this.broker.cacher.set(
            `createOrder_${store.consumer_key}|${ctx.params.id}`,
            1,
            60 * 60 * 24
          );
        }

        const data = this.orderData(ctx.params, store, true);

        // Send received log
        this.sendReceiveLog('Create', data.externalId, store, ctx.params);

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
          handlingTimes: number[];
        } = await this.stockProducts(data.items);

        if (!stock.handlingTimes.length) {
          data.shipment_date = this.calculateWorkingDays(
            new Date(),
            Math.max.apply(null, stock.handlingTimes)
          );
        }

        // Return warning response if no Item available
        if (stock.items.length === 0) {
          this.sendLogs({
            topicId: data.externalId,
            message:
              'The products you ordered are not Knawat products, The order has not been created!',
            storeId: store.url,
            logLevel: 'warn',
            code: 1101,
            payload: {
              errors: {
                products: stock.notKnawat,
              },
              params: ctx.params,
            },
          });

          throw new MpError(
            'Orders Service',
            'The products you ordered are not Knawat products, The order has not been created!',
            404
          );
        }

        // Taxes
        const taxData = await this.setTaxIds(store, stock.items);
        const taxesMsg: { code: number; message: string }[] = taxData.msgs;

        // Update Order Items
        data.items = taxData.items;
        data.isInclusiveTax = taxData.isInclusive;
        const { taxTotal } = taxData;

        // Shipping
        const { shipment, warnings: shipmentWarnings } = await this.shipment(
          stock.items,
          ctx.params.shipping.country,
          store,
          ctx.params.shipping_method
        );

        warnings = warnings.concat(shipmentWarnings);

        if (!shipment) {
          this.sendLogs({
            topicId: data.externalId,
            message: `We don't shipment to ${ctx.params.shipping.country}`,
            storeId: store.url,
            logLevel: 'error',
            code: 400,
            payload: {
              errors: {
                data: shipment,
              },
              params: ctx.params,
            },
          });

          throw new MpError(
            'Orders Service',
            'Sorry the order is not created as there is no shipment method to your country!',
            400
          );
        }

        data.shipping_method = shipment.courier;
        data.shipping_charge = shipment.cost;

        // Calculate the order total
        const total: number =
          data.items.reduce(
            (accumulator: number, current: OrderItem) =>
              accumulator + current.rate * current.quantity,
            0
          ) + (data.isInclusiveTax ? 0 : taxTotal);

        // Getting the current user subscription
        const subscription = await ctx.call('subscription.sGet', {
          id: store.url,
        });
        switch (subscription.attributes.orderProcessingType) {
          case '$':
            data.adjustment = Number(
              subscription.attributes.orderProcessingFees
            );
            data.adjustmentDescription = 'Processing Fees';
            break;
          case '%':
            data.adjustment =
              (Number(subscription.attributes.orderProcessingFees) / 100) *
              total;
            data.adjustmentDescription = `Processing Fees ${subscription.attributes.orderProcessingFees}%`;
            break;
        }

        const orderExpenses = {
          total,
          shipping: data.shipping_charge,
          tax: taxTotal,
          adjustment: data.adjustment,
        };

        const discountResponse: {
          warnings?: [];
          discount?: number;
          coupon: string;
        } = await this.discount({
          code: ctx.params.coupon,
          membership: subscription.membership.id,
          orderExpenses,
          isValid: true,
          isAuto: !ctx.params.coupon,
        });
        if (Array.isArray(discountResponse) && ctx.params.coupon) {
          warnings = warnings.concat(discountResponse.warnings);
        }
        if (discountResponse?.discount) {
          data.discount = discountResponse.discount.toString();
          data.coupon = discountResponse.coupon;
        }

        // Checking for processing fees
        this.sendLogs({
          topic: 'order',
          topicId: data.externalId,
          message: `Subscription Package: ${
            subscription ? subscription.membership.name.en : 'Free'
          }`,
          storeId: store.url,
          logLevel: 'info',
          code: 2103,
          payload: {
            subscriptionId: subscription.id.toString(),
            params: ctx.params,
          },
        });

        data.status = 'draft';
        data.subscription = subscription.membership.name.en;

        // Initializing warnings array if we have a Warning
        warnings = warnings.concat(
          this.warningsMessenger(
            stock.outOfStock,
            stock.notEnoughStock,
            data,
            store,
            ctx.params.shipping_method,
            ctx.params.shipping,
            shipment,
            ctx.params
          )
        );
        warnings = warnings.concat(taxesMsg);

        if (warnings.length) {
          data.warnings = JSON.stringify(warnings);
          const warningsSnippetMessages = warnings
            .map(warn => warn.message)
            .filter((msg, i, arr) => i === arr.indexOf(msg));
          data.warningsSnippet = warningsSnippetMessages.reduce(
            (a: string, msg: string) => `${a}${a && ','}${msg}`,
            ''
          );
        }

        const result: OrderOMSResponse = await ctx
          .call('oms.createNewOrder', data)
          .then(async result => {
            if (result.salesorder) {
              // Clearing order list action(API) cache
              await this.broker.cacher.clean(
                `orders.list:undefined|${ctx.meta.user}**`
              );
              this.cacheUpdate(result.salesorder, store);
            }

            return result;
          });

        if (result.error) {
          this.sendLogs({
            topicId: data.externalId,
            message: result.error.message,
            storeId: store.url,
            logLevel: 'error',
            code: result.error.statusCode,
            payload: {
              errors: result.error?.details || result,
              params: ctx.params,
            },
          });
          ctx.meta.$statusCode = result.error?.statusCode;
          ctx.meta.$statusMessage = result.error?.name;
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

        if (order && !store.internal_data?.omsId) {
          ctx
            .call('stores.update', {
              id: store.url,
              internal_data: {
                omsId: result.salesorder.store.id,
              },
            })
            .then(r => this.logger.info(r));
        }

        // TODO: Move to hook after create, and write this code into coupon service
        // If coupon used update quantity
        if (data.coupon) {
          ctx.call('coupons.updateCount', { id: data.coupon });
        }

        // TODO: Move to hook after create, and write this code into CRM service
        // Update CRM last update
        ctx.call('crm.updateStoreById', {
          id: store.url,
          last_order_date: Date.now(),
        });

        // Update products sales quantity
        ctx.call('products.updateQuantityAttributes', {
          products: stock.products.map((product: Product) => ({
            id: product.sku,
            qty: product.sales_qty + 1 || 1,
            attribute: 'sales_qty',
          })),
        });

        const message: {
          status?: string;
          // Remove any later
          data?: OrderOMSResponse['salesorder'] | any;
          warnings?: GenericObject[];
          errors?: GenericObject[];
        } = {
          status: 'success',
          data: order,
        };

        if (warnings.length) {
          // TODO: Move to hook after create, and write this code into notifications service
          this.sendMail({
            to: process.env.SUPPORT_MAIL,
            subject: 'Order Warnings',
            text: `${warnings.reduce(
              (a, o) => `${a}${o.message}\n`,
              `OrderID: ${order.id}\n`
            )}`,
          });

          // Return in the response
          message.warnings = warnings;
        }

        this.sendLogs({
          topicId: data.externalId,
          message: 'Order created successfully',
          storeId: store.url,
          logLevel: 'info',
          code: 200,
        });
        return message;
      },
    },
    updateOrder: {
      auth: ['Bearer'],
      async handler(ctx) {
        // Initialize warnings array
        let warnings: { code: number; message: string }[] = [];
        const { store } = ctx.meta;

        const orderBeforeUpdate = await ctx.call('orders.getOrder', {
          order_id: ctx.params.id,
        });

        // Send received log
        this.sendReceiveLog(
          'Update',
          orderBeforeUpdate?.externalId,
          store,
          ctx.params
        );

        // Check update possibility
        this.checkUpdateStatus(orderBeforeUpdate, ctx.params);

        const data = this.orderData(ctx.params);
        if (data.shipping) data.shipping = this.normalizeAddress(data.shipping);

        data.status = this.normalizeUpdateRequestStatus(data.status);
        // Change
        if (data.status === 'cancelled' || data.status === 'void') {
          return ctx
            .call('orders.deleteOrder', { id: ctx.params.id })
            .then(res => {
              this.broker.cacher.clean(
                `orders.list:undefined|${ctx.meta.user}**`
              );
              this.broker.cacher.clean(`orders.getOrder:${ctx.params.id}**`);
              return res;
            });
        }

        const message: {
          status?: string;
          // Remove any later
          data?: OrderOMSResponse['salesorder'] | any;
          warnings?: GenericObject[];
          errors?: GenericObject[];
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
                storeId: store.url,
                logLevel: 'warn',
                code: 1101,
                payload: {
                  errors: {
                    products: stock.notKnawat,
                  },
                  params: ctx.params,
                },
              });
              throw new MpError(
                'Not Found',
                'The products you ordered are not Knawat products, The order has not been created!',
                404
              );
            }

            // Get Shipping Country
            let country = orderBeforeUpdate.shipping.country;
            if (ctx.params.shipping?.country) {
              country = ctx.params.shipping.country;
            }

            // Taxes
            const taxData = await this.setTaxIds(store, stock.items);
            const taxesMsg: { code: number; message: string }[] = taxData.msgs;
            const { taxTotal } = taxData;

            // Update Order Items
            data.items = taxData.items;
            data.isInclusiveTax = taxData.isInclusive;

            // Shipping
            shipment = await this.shipment(
              stock.items,
              country,
              store,
              ctx.params.shipping_method
            );

            if (shipment) {
              data.shipping_method = shipment.courier;
              data.shipping_charge = shipment.cost;
            }
            // Calculate the order total
            const total: number =
              data.items.reduce(
                (accumulator: number, current: OrderItem) =>
                  accumulator + current.purchaseRate * current.quantity,
                0
              ) + (data.isInclusiveTax ? 0 : taxTotal);

            // Getting the current user subscription
            const subscription = await ctx.call('subscription.sGet', {
              id: store.url,
            });
            if (subscription.attributes.orderProcessingType === '%') {
              subscription.adjustment =
                (subscription.attributes.orderProcessingFees / 100) * total;
              subscription.adjustmentDescription = `Processing Fees ${subscription.attributes.orderProcessingFees}%`;
            }

            const orderExpenses = {
              total,
              shipping: data.shipping_charge,
              tax: taxTotal,
              adjustment: data.adjustment,
            };
            if (orderBeforeUpdate.coupon) {
              const discountResponse: {
                warnings?: [];
                discount?: number;
              } = await this.discount({
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
            warnings = warnings.concat(
              this.warningsMessenger(
                stock.outOfStock,
                stock.notEnoughStock,
                data,
                store,
                ctx.params.shipping_method,
                ctx.params.shipping,
                shipment,
                ctx.params
              )
            );
            warnings = warnings.concat(taxesMsg);
            data.warnings = JSON.stringify(warnings);
            const warningsSnippetMessages = warnings
              .map(warn => warn.message)
              .filter((msg, i, arr) => i === arr.indexOf(msg));
            data.warningsSnippet = warningsSnippetMessages.reduce(
              (a: string, msg: string) => `${a}${a && ','}${msg}`,
              ''
            );
          }
          // Convert status
          data.status = ['pending', 'processing', 'cancelled'].includes(
            data.status
          )
            ? this.normalizeStatus(data.status)
            : data.status;
          // Update order
          const result: OrderOMSResponse = await ctx.call(
            'oms.updateOrderById',
            {
              customerId: store.internal_data.omsId,
              orderId: ctx.params.id,
              ...data,
            }
          );

          if (!result.salesorder) {
            this.sendLogs({
              topicId: orderBeforeUpdate.externalId,
              message: result.error.message,
              storeId: store.url,
              logLevel: 'error',
              code: result.error.statusCode,
              payload: {
                errors: result.error?.details || result,
                params: ctx.params,
              },
            });
            ctx.meta.$statusCode = result.error?.statusCode;
            ctx.meta.$statusMessage = result.error?.name;
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
          await this.broker.cacher.clean(
            `orders.list:undefined|${ctx.meta.user}**`
          );
          this.cacheUpdate(order, store);
          message.status = 'success';
          message.data = order;
          if (warnings.length > 0) message.warnings = warnings;
          this.sendLogs({
            topicId: data.externalId,
            message: 'Order updated successfully',
            storeId: store.url,
            logLevel: 'info',
            code: 200,
          });
          return message;
        } catch (err) {
          this.logger.error(err);
          this.sendLogs({
            topicId: orderBeforeUpdate.externalId,
            message:
              err?.stack || err?.error?.message
                ? err.error.message
                : 'Order Error',
            storeId: store.url,
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
      auth: ['Bearer'],
      cache: {
        keys: ['#user', 'order_id'],
        ttl: 60 * 60,
      },
      async handler(ctx) {
        const { store } = ctx.meta;

        if (!store.internal_data?.omsId) {
          ctx.meta.$statusCode = 404;
          ctx.meta.$statusMessage = 'Not Found';
          return {
            message: 'There is no orders for this store!',
          };
        }

        const order = await ctx.call('oms.getOrderById', {
          customerId: store.internal_data.omsId,
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

        return order.salesorder;
      },
    },
    list: {
      auth: ['Bearer'],
      cache: {
        keys: [
          'externalId',
          '#user',
          'limit',
          'page',
          'sort',
          'sortOrder',
          'status',
          'timestamp',
        ],
        ttl: 60 * 60 * 24,
      },
      async handler(ctx) {
        const { store } = ctx.meta;

        if (!store.internal_data?.omsId) {
          return [];
        }
        const queryParams: GenericObject = {};
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
          customerId: store.internal_data.omsId,
          ...queryParams,
        });
        return orders.salesorders;
      },
    },
    deleteOrder: {
      auth: ['Bearer'],
      async handler(ctx) {
        const orderBeforeUpdate = await ctx.call('orders.getOrder', {
          order_id: ctx.params.id,
        });

        // Check cancel possibility
        this.checkUpdateStatus(orderBeforeUpdate, ctx.params);

        if (orderBeforeUpdate.status === 'Cancelled') {
          return { message: 'The Order Is Already Cancelled' };
        }
        const { store } = ctx.meta;
        // Send received log
        this.sendReceiveLog('Cancel', ctx.params.id, store, ctx.params);

        return ctx
          .call('oms.deleteOrderById', {
            customerId: store.internal_data?.omsId,
            orderId: ctx.params.id,
          })
          .then(async result => {
            if (result.salesorder) {
              // Clean list cache
              this.broker.cacher.clean(
                `orders.list:undefined|${ctx.meta.user}**`
              );
              // Update order by id cache
              this.cacheUpdate(result.salesorder, store);
              return {
                status: 'success',
                data: {
                  order_id: ctx.params.id,
                },
              };
            }

            this.sendLogs({
              topicId: ctx.params.id,
              message: result.error?.message
                ? result.error.message
                : 'Order Error',
              storeId: store.url,
              logLevel: 'error',
              code: 500,
              payload: { errors: result.error || result, params: ctx.params },
            });
            throw new MpError('Orders Service', 'Internal Server Error', 500);
          });
      },
    },
    payOrder: {
      auth: ['Bearer'],
      async handler(ctx: Context) {
        const store = await ctx.call('stores.sGet', { id: ctx.meta.store.url });

        const order = await ctx.call('orders.getOrder', {
          order_id: ctx.params.id,
        });

        if (order.financialStatus === 'paid') {
          return {
            message: 'This order is already paid!',
          };
        }

        if (order.total > store.credit) {
          throw new MpError(
            'Orders Service',
            "You don't have enough balance",
            402
          );
        }

        if (order?.id) {
          let invoiceId = '';
          if (order.status === 'invoiced') {
            ({
              invoices: [{ invoice_id: invoiceId }],
            } = await ctx.call('invoices.get', {
              reference_number: order.orderNumber,
            }));
          } else {
            ({
              invoice: { invoiceId },
            } = await ctx.call('invoices.createOrderInvoice', {
              storeId: store.url,
              orderId: order.id,
            }));
          }

          await ctx.call('invoices.markInvoiceSent', {
            omsId: ctx.meta.store.internal_data.omsId,
            invoiceId,
          });

          const applyCreditRes = await ctx.call('invoices.applyCredits', {
            id: invoiceId,
          });

          setTimeout(
            storeKey => {
              this.broker.cacher.clean(`orders.list:undefined|${storeKey}**`);
            },
            60000,
            ctx.meta.user
          );

          const productsRes = await ctx.call(
            'products.getProductsByVariationSku',
            {
              skus: order.items.map((item: OrderItem) => item.sku),
            }
          );

          if (productsRes.products.length > 0) {
            const handlingTimes: number[] = [];
            productsRes.products.filter((product: Product) => {
              if (product.handling_time?.to) {
                handlingTimes.push(product.handling_time.to);
              }
            });

            if (!handlingTimes.length) {
              order.shipment_date = this.calculateWorkingDays(
                new Date(),
                Math.max.apply(null, handlingTimes)
              );
            }
          }

          order.status = 'paid';
          order.financialStatus = 'paid';
          order.fulfillmentStatus = 'processing';
          this.cacheUpdate(order, store);

          return applyCreditRes;
        }
      },
    },
    getOrderWarnings: {
      auth: ['Bearer'],
      cache: {
        keys: ['order_id'],
        ttl: 60 * 6,
      },
      async handler(ctx: Context) {
        const { order_id } = ctx.params;
        const { store: instance } = ctx.meta;
        const order = await ctx.call('orders.getOrder', { order_id });
        const { outOfStock, notEnoughStock } = await this.stockProducts(
          order.items
        );
        const warnings = this.warningsMessenger(
          outOfStock,
          notEnoughStock,
          order,
          instance
        );

        const warningsStr = JSON.stringify(warnings);
        const warningsSnippetMessages = warnings
          .map((warn: { message: string }) => warn.message)
          .filter(
            (msg: string, i: number, arr: string[]) => i === arr.indexOf(msg)
          );
        const warningsSnippet = warningsSnippetMessages.reduce(
          (a: string, msg: string) => `${a}${a && ','}${msg}`,
          ''
        );

        ctx
          .call('oms.updateOrderById', {
            orderId: order_id,
            customerId: instance.internal_data?.omsId,
            warnings: warningsStr,
            warningsSnippet,
          })
          .then(({ salesorder }) => {
            this.cacheUpdate(salesorder, instance);
          });

        return warnings;
      },
    },
  },
  methods: {
    /**
     * Convert order status from MP status to OMS status
     *
     * @param {string} _status
     * @returns {string}
     */
    normalizeStatus(_status: string): string {
      let status = _status;
      switch (_status) {
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
     * Convert order status from ZApp status to OMS Status
     *
     * @param {string} status
     * @returns
     */
    normalizeUpdateRequestStatus(_status: string): string {
      let status = _status;
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
      params
    ) {
      const warnings = [];
      try {
        if (outOfStock.length > 0) {
          outOfStock.forEach(item => {
            warnings.push({
              message: 'out_of_stock',
              sku: item.sku,
            });
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
          notEnoughStock.forEach(item => {
            warnings.push({
              message: 'low_stock',
              sku: item.sku,
              data: { available_qty: item.quantity },
            });
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
        // Check address data
        if (!this.checkAddress(instance, data.externalId)) {
          warnings.push({
            message: 'billing_missing',
            code: 1104,
          });
        }
        // Shipment check
        if (shippingMethod) {
          this.checkShipment(
            instance,
            data,
            shippingMethod,
            shipping,
            shipment,
            params
          );
        }
      } catch (err) {
        this.logger.error(err);
      }
      return warnings;
    },
    /**
     * Send logs if there is any change or missing shipment method
     *
     * @param instance
     * @param data
     * @param shippingMethod
     * @param shipping
     * @param shipment
     * @param params
     */
    checkShipment(instance, data, shippingMethod, shipping, shipment, params) {
      if (!instance.shipping_methods?.[0].name && !shippingMethod) {
        this.sendLogs({
          topic: 'order',
          topicId: data.externalId,
          message: `There is no default shipping method for your store, It’ll be shipped with ${
            shipment.courier || 'Standard'
          }`,
          storeId: instance.url,
          logLevel: 'warn',
          code: 2102,
          payload: { shipment, params },
        });
      }
      if (
        (shipment.courier !== shippingMethod && shippingMethod) ||
        (shipment.courier !== instance.shipping_methods?.[0]?.name &&
          instance.shipping_methods?.[0]?.name)
      ) {
        this.sendLogs({
          topic: 'order',
          topicId: data.externalId,
          message: `Can’t ship to ${
            shipping.country
          } with provided courier, It’ll be shipped with ${
            shipment.courier || 'Standard'
          }, Contact our customer support for more info`,
          storeId: instance.url,
          logLevel: 'warn',
          code: 2101,
          payload: { shipment, params },
        });
      }
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
        shipping_method: params.shipping_method,
      };
      if (create) {
        data.externalId = params.id ? String(params.id) : uuidv1();
        data.invoice_url =
          params.invoice_url ||
          `${this.settings.BASEURL}/invoice/${encodeURIComponent(
            instance.url
          )}/external/${data.externalId}`;
        // Order store data
        data.store = instance.internal_data?.omsId
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
      const taxesMsg: GenericObject[] = [];
      let isInclusive = false;
      let taxTotal = 0;
      const itemsAfterTaxes = await Promise.all(
        items.map(async (item: OrderItem) => {
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
            taxTotal += (item.rate / 100) * taxData.percentage;
          }

          return item;
        })
      );
      return {
        items: itemsAfterTaxes,
        isInclusive,
        msgs: taxesMsg,
        taxTotal,
      };
    },
    async cacheUpdate(order, instance) {
      await Promise.all([
        this.broker.cacher.set(
          `orders.getOrder:${instance.consumer_key}|${order.id}`,
          order
        ),
        this.broker.cacher.set(
          `orders.list:${order.externalId}|${instance.consumer_key}|undefined|undefined|undefined|undefined|undefined|undefined`,
          [order]
        ),
      ]);
    },
    /**
     * Send a logs for acknowledge that the action received the requested action
     * @param action
     * @param order
     * @param instance
     * @param params
     */
    sendReceiveLog(action, externalId, instance, params) {
      this.sendLogs({
        topic: 'order',
        topicId: externalId,
        message: `${action} Order Received!`,
        storeId: instance.url,
        logLevel: 'info',
        code: 100,
        payload: {
          params,
        },
      });
    },
    /**
     *  Check order availability and possibility for update
     * @param order
     */
    checkUpdateStatus(order, params) {
      if (order.id === -1) {
        throw new MpError('Not Found', 'Order Not Found!', 404);
      }
      if (
        order.financialStatus !== 'unpaid' ||
        order.fulfillmentStatus !== 'pending'
      ) {
        throw new MpError(
          'Not Allowed',
          'The Order Is Now Processed With Knawat You Can Not Update Or Cancel It',
          405
        );
      }
      if (order.status === 'Cancelled') {
        throw new MpError(
          'Not Allowed',
          'The Order Is Cancelled, You Can Not Update Or Cancel It',
          405
        );
      }
    },
    /**
     * Calculate Working Days Exculded saturday and sunday
     *
     * @param fromDate
     * @param days
     */
    calculateWorkingDays(fromDate: Date, days: number): string {
      const day = fromDate.getDay();

      const newDate = new Date(fromDate.getTime());
      newDate.setDate(
        fromDate.getDate() +
          days +
          (day === 6 ? 2 : Number(!day)) +
          Math.floor((days - 1 + (day % 6 || 1)) / 5) * 2
      );
      return newDate.toISOString();
    },
  },
};

export = TheService;
