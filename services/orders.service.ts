import { Context, ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';
import { v1 as uuidv1 } from 'uuid';

import { OrdersOperations } from '../utilities/mixins/orders.mixin';
import {
  Log,
  OMSResponse,
  Order,
  OrderAddress,
  OrderItem,
  Product,
  Store,
  Subscription,
  User
} from '../utilities/types';
import {
  createOrderValidation,
  updateOrderValidation
} from '../utilities/validations/orders.validate';

const TheService: ServiceSchema = {
  name: 'orders',
  mixins: [OrdersOperations],
  settings: {
    AUTH: Buffer.from(`${process.env.BASIC_USER}:${process.env.BASIC_PASS}`).toString('base64'),
    BASEURL:
      process.env.NODE_ENV === 'production'
        ? 'https://mp.knawat.io/api'
        : 'https://dev.mp.knawat.io/api'
  },
  actions: {
    createOrder: {
      auth: 'Bearer',
      params: createOrderValidation,
      async handler(ctx: Context) {
        // Get the Store instance
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user
        });

        const data = this.orderData(ctx.params, instance, true);

        this.sendLogs({
          topic: 'order',
          topicId: data.externalId,
          message: `Order Received!`,
          storeId: instance.url,
          logLevel: 'info',
          code: 100,
          payload: {
            params: ctx.params
          }
        });
        // Check the available products and quantities return object with inStock products info
        const stock: {
          products: Array<{ _source: Product; _id: string }>;
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
            message: `The products you ordered are not Knawat products, The order has not been created!`,
            storeId: instance.url,
            logLevel: 'warn',
            code: 1101,
            payload: {
              errors: {
                products: stock.notKnawat
              },
              params: ctx.params
            }
          });

          ctx.meta.$statusCode = 404;
          ctx.meta.$statusMessage = 'Not Found';
          return {
            errors: [
              {
                status: 'fail',
                message:
                  'The products you ordered are not Knawat products, The order has not been created!',
                code: 1101
              }
            ]
          };
        }

        // Update Order Items
        data.items = stock.items;
        // Shipping
        const shipment = await this.shipment(
          stock.items,
          ctx.params.shipping.country,
          instance,
          ctx.params.shipping_method
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
                data: shipment
              },
              params: ctx.params
            }
          });
          ctx.meta.$statusCode = 400;
          ctx.meta.$statusMessage = 'Not Found';
          return {
            errors: [
              {
                status: 'fail',
                message:
                  'Sorry the order is not created as there is no shipment method to your country!',
                code: 1107
              }
            ]
          };
        }

        data.shipmentCourier = shipment.courier;
        data.shippingCharge = shipment.cost;

        // Calculate the order total
        const total: number = data.items.reduce((accumulator: number, current: OrderItem) => accumulator + current.purchaseRate, 0) + data.shippingCharge;

        // Getting the current user subscription
        const subscription = await ctx.call('subscription.get',{ id: instance.url });
        switch (subscription.attributes.orderProcessingType) {
          case '$':
            data.adjustment = subscription.attributes.orderProcessingFees;
            data.adjustmentDescription = `Processing Fees`;
            break;
          case '%':
            subscription.adjustment = subscription.attributes.orderProcessingFees/100 * total;
            subscription.adjustmentDescription = `Processing Fees ${subscription.attributes.orderProcessingFees}%`;
            break;
        }

        // Checking for processing fees
        this.sendLogs({
          topic: 'order',
          topicId: data.externalId,
          message: `Subscription Package: ${subscription ? subscription.membership_name : 'Free'}`,
          storeId: instance.url,
          logLevel: 'info',
          code: 2103,
          payload: { subscription, params: ctx.params }
        });

        data.status = ['pending', 'processing', 'cancelled'].includes(data.status)
          ? this.normalizeStatus(data.status)
          : data.status;
        data.notes = `${stock.outOfStock.reduce(
          (accumulator, item) =>
            `${accumulator} SKU: ${item.sku} Required Qty: ${
              item.quantityRequired
            } Available Qty: ${item.quantity}\n`,
          ''
        )}${stock.notEnoughStock.reduce(
          (accumulator, item) =>
            `${accumulator} SKU: ${item.sku} Required Qty: ${
              item.quantityRequired
            } Available Qty: ${item.quantity}\n`,
          ''
        )}${data.notes}`;
        data.subscription = subscription.membership_name;
        this.logger.info(JSON.stringify(data));
        const result: OMSResponse = await fetch(`${process.env.OMS_BASEURL}/orders`, {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            Authorization: `Basic ${this.settings.AUTH}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        }).then(createResponse => createResponse.json());
        if (!result.salesorder) {
          this.sendLogs({
            topicId: data.externalId,
            message: result.error.message,
            storeId: instance.url,
            logLevel: 'error',
            code: result.error.statusCode,
            payload: { errors: result, params: ctx.params }
          });
          ctx.meta.$statusCode = result.error.statusCode;
          ctx.meta.$statusMessage = result.error.name;
          return {
            errors: [
              {
                status: 'fail',
                message: result.error.details || result.error.message
              }
            ]
          };
        }
        if (result.salesorder && !(instance.internal_data && instance.internal_data.omsId)) {
          ctx
            .call('stores.update', {
              id: instance.url,
              internal_data: {
                omsId: result.salesorder.store.id
              }
            })
            .then(r => this.logger.info(r));
        }
        // Clearing order list action(API) cache
        this.broker.cacher.clean(`orders.list:${ctx.meta.user}**`);

        // Update products sales quantity
        ctx.call('products-list.updateQuantityAttributes', {
          products: stock.products.map((product: { _source: Product; _id: string }) => ({
            _id: product._id,
            qty: product._source.sales_qty || 0,
            attribute: 'sales_qty'
          }))
        });

        /* Prepare the response message in case of success or warnings */
        const order = result.salesorder;
        const message: {
          status?: string;
          data?: OMSResponse['salesorder'] | any; // Remove any after
          warnings?: Array<{}>;
          errors?: Array<{}>;
        } = {
          status: 'success',
          data: {
            id: order.id,
            status: this.normalizeResponseStatus(order.status),
            items: order.items,
            billing: order.billing,
            shipping: order.shipping,
            createDate: order.createDate,
            notes: order.notes || '',
            shipping_method: order.shipmentCourier,
            shipping_charge: order.shippingCharge,
            adjustment: order.adjustment,
            adjustmentDescription: order.adjustmentDescription,
            orderNumber: order.orderNumber
          }
        };

        // Initializing warnings array if we have a Warning
        const warnings = this.warningsMessenger(
          stock.outOfStock,
          stock.notEnoughStock,
          data,
          instance,
          ctx.params.shipping_method,
          ctx.params.shipping,
          shipment,
          ctx.params
        );
        if (warnings.length > 0) message.warnings = warnings;
        this.sendLogs({
          topicId: data.externalId,
          message: `Order created successfully`,
          storeId: instance.url,
          logLevel: 'info',
          code: 200
        });
        return message;
      }
    },
    updateOrder: {
      auth: 'Bearer',
      params: updateOrderValidation,
      async handler(ctx) {
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user
        });
        this.sendLogs({
          topic: 'order',
          topicId: ctx.params.id,
          message: `Cancel Order Received!`,
          storeId: instance.url,
          logLevel: 'info',
          code: 100,
          payload: {
            params: ctx.params
          }
        });
        const orderBeforeUpdate = await ctx.call('orders.getOrder', { order_id: ctx.params.id });
        if (orderBeforeUpdate.id === -1) {
          ctx.meta.$statusCode = 404;
          ctx.meta.$statusMessage = 'Not Found';
          return { message: 'Order Not Found!' };
        }
        // Change here
        if (!['Order Placed', 'Processing', 'Cancelled'].includes(orderBeforeUpdate.status)) {
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
            this.broker.cacher.clean(`orders.list:${ctx.meta.user}**`);
            this.broker.cacher.clean(`orders.getOrder:${ctx.params.id}**`);
            return res;
          });
        }

        const message: {
          status?: string;
          data?: OMSResponse['salesorder'] | any; // Remove any after
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
                message: `The products you ordered are not Knawat products, The order has not been created!`,
                storeId: instance.url,
                logLevel: 'warn',
                code: 1101,
                payload: {
                  errors: {
                    products: stock.notKnawat
                  },
                  params: ctx.params
                }
              });
              ctx.meta.$statusCode = 404;
              ctx.meta.$statusMessage = 'Not Found';
              return {
                errors: [
                  {
                    status: 'fail',
                    message:
                      'The products you ordered are not Knawat products, The order has not been created!',
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
              stock.items,
              country,
              instance,
              ctx.params.shipping_method
            );

            if(shipment) {
              data.shipmentCourier = shipment.courier;
              data.shippingCharge = shipment.cost;
            }
            // Calculate the order total
            const total: number = data.items.reduce((accumulator: number, current: OrderItem) => accumulator + current.purchaseRate, 0) + (data.shippingCharge || orderBeforeUpdate.shippingCharge);

            // Getting the current user subscription
            const subscription = await ctx.call('subscription.get',{ id: instance.url });
            if(subscription.attributes.orderProcessingType === '%') {
                subscription.adjustment = subscription.attributes.orderProcessingFees/100 * total;
                subscription.adjustmentDescription = `Processing Fees ${subscription.attributes.orderProcessingFees}%`;
            }
            // Initializing warnings array if we have a Warning
            const warnings = this.warningsMessenger(
              stock.outOfStock,
              stock.notEnoughStock,
              data,
              instance,
              ctx.params.shipping_method,
              ctx.params.shipping,
              shipment,
              ctx.params
            );
            if (warnings.length > 0) message.warnings = warnings;
          }
          // Convert status
          data.status = ['pending', 'processing', 'cancelled'].includes(data.status)
            ? this.normalizeStatus(data.status)
            : data.status;
          // Update order
          const result: OMSResponse = await fetch(
            `${process.env.OMS_BASEURL}/orders/${instance.internal_data.omsId}/${ctx.params.id}`,
            {
              method: 'PUT',
              body: JSON.stringify(data),
              headers: {
                Authorization: `Basic ${this.settings.AUTH}`,
                'Content-Type': 'application/json',
                Accept: 'application/json'
              }
            }
          ).then(updateResponse => {
            return updateResponse.json();
          });

          this.logger.debug(JSON.stringify(result), '>>>>>>>>');
          if (!result.salesorder) {
            this.sendLogs({
              topicId: orderBeforeUpdate.externalId,
              message: result.error.message,
              storeId: instance.url,
              logLevel: 'error',
              code: result.error.statusCode,
              payload: { errors: result, params: ctx.params }
            });
            ctx.meta.$statusCode = result.error.statusCode;
            ctx.meta.$statusMessage = result.error.name;
            return {
              errors: [
                {
                  status: 'fail',
                  message: result.error.details || result.error.message
                }
              ]
            };
          }
          const order = result.salesorder;
          this.broker.cacher.clean(`orders.list:${ctx.meta.user}**`);
          this.broker.cacher.clean(`orders.getOrder:${ctx.params.id}**`);

          message.status = 'success';
          message.data = {
            id: order.id,
            status: this.normalizeResponseStatus(order.status),
            items: order.items,
            billing: order.billing,
            shipping: order.shipping,
            createDate: order.createDate,
            notes: order.notes || '',
            shipping_method: order.shipmentCourier,
            shipping_charge: order.shippingCharge,
            adjustment: order.adjustment,
            adjustmentDescription: order.adjustmentDescription,
            orderNumber: order.orderNumber
          };
          this.sendLogs({
            topicId: data.externalId,
            message: `Order updated successfully`,
            storeId: instance.url,
            logLevel: 'info',
            code: 200
          });
          return message;
        } catch (err) {
          this.logger.error(err);
          this.sendLogs({
            topicId: orderBeforeUpdate.externalId,
            message: err && err.error && err.error.message ? err.error.message : `Order Error`,
            storeId: instance.url,
            logLevel: 'error',
            code: 500,
            payload: { errors: err.error || err, params: ctx.params }
          });
          ctx.meta.$statusCode = 500;
          ctx.meta.$statusMessage = 'Internal Server Error';
          return {
            errors: [
              {
                status: 'fail',
                message: 'Internal Server Error'
              }
            ]
          };
        }
      }
    },
    getOrder: {
      auth: 'Bearer',
      cache: {
        keys: ['order_id'],
        ttl: 60 * 60 // 1 hour
      },
      params: {
        order_id: { type: 'string' }
      },
      async handler(ctx) {
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user
        });
        if (!(instance.internal_data && instance.internal_data.omsId)) {
          ctx.meta.$statusCode = 404;
          ctx.meta.$statusMessage = 'Not Found';
          return {
            message: 'There is no orders for this store!'
          };
        }

        let order = await fetch(
          `${process.env.OMS_BASEURL}/orders/${instance.internal_data.omsId}/${
            ctx.params.order_id
          }`,
          {
            method: 'get',
            headers: {
              Authorization: `Basic ${this.settings.AUTH}`
            }
          }
        ).then(response => response.json());
        if (order.error) {
          if (order.error.statusCode === 404) {
            ctx.meta.$statusCode = 404;
            ctx.meta.$statusMessage = 'Not Found';
            return {
              message: 'Order Not Found!'
            };
          }
          ctx.meta.$statusCode = 400;
          ctx.meta.$statusMessage = 'Bad Request';
          return {
            message: 'There is an error'
          };
        }
        order = order.salesorder;
        const orderResponse: { [key: string]: string } = {
          id: order.id,
          status: this.normalizeResponseStatus(order.status),
          items: order.items,
          billing: order.billing,
          shipping: order.shipping,
          total: order.total,
          externalId: order.externalId,
          createDate: order.date_created,
          knawat_order_status: order.status ? this.normalizeResponseStatus(order.status) : '',
          notes: order.notes,
          shipping_method: order.shipmentCourier,
          shipping_charge: order.shippingCharge,
          adjustment: order.adjustment,
          adjustmentDescription: order.adjustmentDescription,
          shipment_tracking_number: order.shipmentTrackingNumber,
          orderNumber: order.orderNumber
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
        if (order.notes) orderResponse.notes = order.notes;
        return orderResponse;
      }
    },
    list: {
      auth: 'Bearer',
      cache: {
        keys: ['#user', 'limit', 'page', 'sort', 'sortOrder', 'status', 'externalId'],
        ttl: 60 * 60
      },
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
        },
        sort: {
          type: 'enum',
          values: [
            'created_time',
            'customer_name',
            'salesorder_number',
            'shipment_date',
            'total',
            'date'
          ],
          optional: true
        },
        sortOrder: { type: 'enum', values: ['A', 'D'], optional: true },
        status: {
          type: 'enum',
          values: ['draft', 'open', 'invoiced', 'partially_invoiced', 'void', 'overdue'],
          optional: true
        },
        externalId: { type: 'string', optional: true },
        date: { type: 'date', convert: true, optional: true },
        dateStart: { type: 'date', convert: true, optional: true },
        dateEnd: { type: 'date', convert: true, optional: true },
        dateAfter: { type: 'date', convert: true, optional: true },
        shipmentDate: { type: 'date', convert: true, optional: true },
        shipmentDateStart: { type: 'date', convert: true, optional: true },
        shipmentDateEnd: { type: 'date', convert: true, optional: true },
        shipmentDateBefore: { type: 'date', convert: true, optional: true },
        shipmentDateAfter: { type: 'date', convert: true, optional: true }
      },
      async handler(ctx) {
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user
        });
        if (!(instance.internal_data && instance.internal_data.omsId)) {
          ctx.meta.$statusCode = 404;
          ctx.meta.$statusMessage = 'Not Found';
          return {
            message: 'There is no orders for this store!'
          };
        }
        const url = new URL(`${process.env.OMS_BASEURL}/orders/${instance.internal_data.omsId}`);
        if (ctx.params.limit) url.searchParams.append('perPage', ctx.params.limit);
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
          'shipmentDateAfter'
        ];
        Object.keys(ctx.params).forEach(key => {
          if (!keys.includes(key)) return;
          url.searchParams.append(key, ctx.params[key]);
        });
        const orders = await fetch(url.href, {
          method: 'get',
          headers: {
            Authorization: `Basic ${this.settings.AUTH}`
          }
        }).then(response => response.json());
        return orders.salesorders.map((order: Order) => ({
          id: order.id,
          externalId: order.externalId,
          status: this.normalizeResponseStatus(order.status),
          createDate: order.createDate,
          updateDate: order.updateDate,
          total: order.total,
          knawat_order_status: order.status ? this.normalizeResponseStatus(order.status) : '',
          orderNumber: order.orderNumber
        }));
      }
    },
    deleteOrder: {
      auth: 'Bearer',
      params: {
        id: { type: 'string', convert: true }
      },
      async handler(ctx) {
        const orderBeforeUpdate = await ctx.call('orders.getOrder', { order_id: ctx.params.id });
        if (orderBeforeUpdate.id === -1) {
          ctx.meta.$statusCode = 404;
          ctx.meta.$statusMessage = 'Not Found';
          return { message: 'Order Not Found!' };
        }
        // Change here
        if (!['Order Placed', 'Processing', 'Cancelled'].includes(orderBeforeUpdate.status)) {
          ctx.meta.$statusCode = 405;
          ctx.meta.$statusMessage = 'Not Allowed';
          return { message: 'The Order Is Now Processed With Knawat You Can Not Update It' };
        }
        if ('Cancelled' === orderBeforeUpdate.status) {
          return { message: 'The Order Is Already Cancelled' };
        }
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user
        });
        this.sendLogs({
          topic: 'order',
          topicId: ctx.params.id,
          message: `Cancel Order Received!`,
          storeId: instance.url,
          logLevel: 'info',
          code: 100,
          payload: {
            params: ctx.params
          }
        });
        return fetch(
          `${process.env.OMS_BASEURL}/orders/${instance.internal_data.omsId}/${ctx.params.id}`,
          {
            method: 'delete',
            headers: {
              Authorization: `Basic ${this.settings.AUTH}`
            }
          }
        )
          .then(async response => {
            const result = await response.json();
            this.broker.cacher.clean(`orders.list:${ctx.meta.user}**`);
            this.broker.cacher.clean(`orders.getOrder:${ctx.params.id}**`);
            if (result.salesorder) {
              return {
                status: 'success',
                data: {
                  order_id: ctx.params.id
                }
              };
            }

            this.logger.error(result);

            this.sendLogs({
              topicId: ctx.params.id,
              message:
                result && result.error && result.error.message
                  ? result.error.message
                  : `Order Error`,
              storeId: instance.url,
              logLevel: 'error',
              code: 500,
              payload: { errors: result.error || result, params: ctx.params }
            });
            ctx.meta.$statusCode = 500;
            ctx.meta.$statusMessage = 'Internal Server Error';
            return {
              errors: [
                {
                  status: 'fail',
                  message: 'Internal Server Error'
                }
              ]
            };
          })
          .catch(err => {
            this.sendLogs({
              topicId: ctx.params.id,
              message: err && err.error && err.error.message ? err.error.message : `Order Error`,
              storeId: instance.url,
              logLevel: 'error',
              code: 500,
              payload: { errors: err.error || err, params: ctx.params }
            });
            ctx.meta.$statusCode = 500;
            ctx.meta.$statusMessage = 'Internal Server Error';
            return {
              errors: [
                {
                  status: 'fail',
                  message: 'Internal Server Error'
                }
              ]
            };
          });
      }
    }
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
        default:
          status = status;
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
        default:
          status = status;
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
          warnings.push({
            message: `This items are out of stock ${outOfStock.map(e => e.sku).join()}`,
            skus: outOfStock.map(e => e.sku),
            code: 1102
          });
          this.sendLogs({
            topic: 'order',
            topicId: data.externalId,
            message: `Some products are out of stock`,
            storeId: instance.url,
            logLevel: 'warn',
            code: 1102,
            payload: { outOfStock, params }
          });
        }
        if (notEnoughStock.length > 0) {
          warnings.push({
            message: `This items quantities are not enough stock ${notEnoughStock
              .map(e => e.sku)
              .join()}`,
            skus: notEnoughStock.map(e => e.sku),
            code: 1103
          });
          this.sendLogs({
            topic: 'order',
            topicId: data.externalId,
            message: `This items quantities are not enough stock`,
            storeId: instance.url,
            logLevel: 'warn',
            code: 1103,
            payload: { outOfStock, params }
          });
        }
        if ((!instance.shipping_methods || !instance.shipping_methods[0].name) && !shippingMethod) {
          warnings.push({
            message: `There is no default shipping method for your store, It’ll be shipped with ${shipment.courier ||
              'Standard'}, Contact our customer support for more info`,
            code: 2102
          });
          this.sendLogs({
            topic: 'order',
            topicId: data.externalId,
            message: `There is no default shipping method for your store, It’ll be shipped with ${shipment.courier ||
              'Standard'}`,
            storeId: instance.url,
            logLevel: 'warn',
            code: 2102,
            payload: { shipment, params }
          });
        }
        if (
          (shipment.courier !== shippingMethod && shippingMethod) ||
          (instance.shipping_methods &&
            instance.shipping_methods[0].name &&
            shipment.courier !== instance.shipping_methods[0].name)
        ) {
          warnings.push({
            message: `Can’t ship to ${
              shipping.country
            } with provided courier, It’ll be shipped with ${shipment.courier ||
              'Standard'}, Contact our customer support for more info`,
            code: 2101
          });
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
            payload: { shipment, params }
          });
        }
        if (!this.checkAddress(instance, data.externalId)) {
          warnings.push({
            message: `Billing address not found`,
            code: 1104
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
    orderData(params: Order, instance, create = false) {
      const data: Order = {
        status: params.status,
        items: params.items || params.line_items,
        shipping: params.shipping,
        notes: params.notes,
        shipping_method: params.shipping_method || params.shipmentCourier
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
                users: instance.users
              };
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
          message: `No Billing Address Or Address Missing Data.`,
          storeId: instance.url,
          logLevel: 'warn',
          code: 1104
        });
        return false;
      }
      return true;
    }
  }
};

export = TheService;
