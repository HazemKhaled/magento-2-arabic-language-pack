import { Context, ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';
import { v1 as uuidv1 } from 'uuid';
import { OrdersOperations } from '../utilities/mixins/orders.mixin';
import { OMSResponse, Order, OrderItem } from '../utilities/types/order.type';
import { Product } from '../utilities/types/product.type';
import { StoreUser } from '../utilities/types/store.type';
import { Subscription } from '../utilities/types/user.type';
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
        // TODO it should be assigned directly to data
        ctx.params.externalId = uuidv1();
        if (ctx.params.shipping.company === 'ebay') ctx.params.externalId = ctx.params.id;

        // TODO this assignment should be changed to specific fields (Sanitize inputs)
        const data = ctx.params;

        // Add externalInvoice url
        data.externalInvoice =
          ctx.params.invoice_url ||
          `${this.settings.BASEURL}/invoice/external/${ctx.params.externalId}`;

        // Get the Store instance
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user
        });

        // Check required store info. availability
        // TODO change to method...
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
            topicId: data.externalId,
            message: `No Billing Address Or Address Missing Data. Your order failed!`,
            storeId: instance.url,
            logLevel: 'error',
            code: 428
          });
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

        // Order store data
        data.store =
          instance.internal_data && instance.internal_data.omsId
            ? { id: instance.internal_data.omsId }
            : { url: instance.url, name: instance.name };

        // Check the available products and quantities return object with inStock products info
        const stock = await this.stockProducts(data.items);
        // Return warning response if no Item available
        if (stock.items.length === 0) {
          this.sendLogs({
            topic: 'order',
            topicId: data.externalId,
            message: `The products you ordered is not in-stock, The order has not been created!`,
            storeId: instance.url,
            logLevel: 'error',
            code: 1101
          });
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
          stock.items,
          ctx.params.shipping.country,
          instance,
          ctx.params.shipping_method
        );

        if (!shipment) {
          this.sendLogs({
            topic: 'order',
            topicId: data.externalId,
            message: `Sorry the order is not created as there is no shipment method to your country!`,
            storeId: instance.url,
            logLevel: 'error',
            code: 400
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
        // Getting the current user subscription
        const subscription = this.currentSubscriptions(instance);

        // Checking for processing fees
        if (subscription.attr_order_processing_fees && subscription.attr_order_processing_fees > 0)
          data.items.push({
            sku: 'PROCESSING-FEE',
            quantity: 1,
            name: 'PROCESSING-FEE',
            url: 'https://knawat.com',
            rate: 2,
            purchase_rate: 2,
            vendor_id: 0
          });
        // Preparing billing data
        data.billing = { ...instance.address };

        data.externalId = uuidv1();
        data.status = ['pending', 'processing', 'cancelled'].includes(data.status)
          ? this.normalizeStatus(data.status)
          : data.status;
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

        this.logger.info(JSON.stringify(result));
        if (!result.salesorder) {
          this.sendLogs({
            topic: 'order',
            topicId: data.externalId,
            message: `Internal Server Error`,
            storeId: instance.url,
            logLevel: 'error',
            code: 500,
            payload: { errors: result }
          });
          ctx.meta.$statusCode = 500;
          ctx.meta.$statusMessage = 'Internal Error';
          return {
            errors: [
              {
                status: 'fail',
                message: 'Internal Server Error'
              }
            ]
          };
        }
        if (result.salesorder && (!instance.internal_data || !instance.internal_data.omsId)) {
          ctx.call('stores.update', {
            id: instance.url,
            internal_data: {
              omsId: result.salesorder.store.id
            }
          });
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
            shipping_charge: order.shippingCharge
          }
        };
        const outOfStock = stock.orderItems.filter(
          (item: OrderItem) => !stock.inStock.map((i: OrderItem) => i.sku).includes(item)
        );
        const notEnoughStock = stock.inStock.filter(
          (item: OrderItem) => !stock.enoughStock.map((i: OrderItem) => i.sku).includes(item.sku)
        );

        // Initializing warnings array if we have a Warning
        const warnings = this.warningsMessenger(
          outOfStock,
          notEnoughStock,
          data,
          instance,
          ctx.params.shipping_method,
          ctx.params.shipping,
          shipment
        );
        if (warnings.length > 0) message.warnings = warnings;
        this.sendLogs({
          topic: 'order',
          topicId: data.externalId,
          message: `Order ${data.id} created successfully`,
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
        const orderBeforeUpdate = await ctx.call('orders.getOrder', { order_id: ctx.params.id });
        if (orderBeforeUpdate.id === -1) {
          return { message: 'Order Not Found!' };
        }
        // Change here
        if (!['open', 'draft', 'void'].includes(orderBeforeUpdate.status)) {
          return { message: 'The Order Is Now Processed With Knawat You Can Not Update It' };
        }

        const data = ctx.params;
        if (data.shipping) data.shipping = this.normalizeAddress(data.shipping);
        if (data.billing) data.billing = this.normalizeAddress(data.billing);
        if (ctx.params.invoice_url) data.externalInvoice = ctx.params.invoice_url;

        data.status = this.normalizeUpdateRequestStatus(data.status);
        // Change
        if (data.status === 'cancelled' || data.status === 'void') {
          return ctx.call('orders.delete', { id: data.id }).then(res => {
            this.broker.cacher.clean(`orders.list:${ctx.meta.user}**`);
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
        // If there is items
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user
        });

        try {
          if (ctx.params.items) {
            // Check the available products and quantities return object with inStock products info
            const stock = await this.stockProducts(data.items);
            // Return error response if no Item available
            if (stock.enoughStock.length === 0) {
              this.sendLogs({
                topic: 'order',
                topicId: orderBeforeUpdate.externalId,
                message: `The products you ordered is not in-stock, The order has not been created!`,
                storeId: instance.url,
                logLevel: 'error',
                code: 1101
              });
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
              (item: OrderItem) => !stock.inStock.map((i: OrderItem) => i.sku).includes(item)
            );
            const notEnoughStock = stock.inStock.filter(
              (item: OrderItem) =>
                !stock.enoughStock.map((i: OrderItem) => i.sku).includes(item.sku)
            );

            // Initializing warnings array if we have a Warning
            const warnings = this.warningsMessenger(
              outOfStock,
              notEnoughStock,
              data,
              instance,
              ctx.params.shipping_method,
              ctx.params.shipping,
              shipment
            );
            if (warnings.length > 0) message.warnings = warnings;
          }
          // Convert status
          data.status = ['pending', 'processing', 'cancelled'].includes(data.status)
            ? this.normalizeStatus(data.status)
            : data.status;

          // Update order
          this.logger.info(JSON.stringify(data));
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
          ).then(createResponse => createResponse.json());

          this.logger.info(JSON.stringify(result), '>>>>>>>>');
          if (!result.salesorder) {
            this.sendLogs({
              topic: 'order',
              topicId: orderBeforeUpdate.externalId,
              message: `Internal Server Error`,
              storeId: instance.url,
              logLevel: 'error',
              code: 500,
              payload: { errors: result }
            });
            ctx.meta.$statusCode = 500;
            ctx.meta.$statusMessage = 'Internal Error';
            return {
              errors: [
                {
                  status: 'fail',
                  message: 'Internal Server Error'
                }
              ]
            };
          }
          const order = result.salesorder;
          this.broker.cacher.clean(`orders.list:${ctx.meta.user}**`);

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
            shipping_charge: order.shippingCharge
          };
          this.sendLogs({
            topic: 'order',
            topicId: data.externalId,
            message: `Order ${data.id} updated successfully`,
            storeId: instance.url,
            logLevel: 'info',
            code: 200
          });
          return message;
        } catch (err) {
          this.logger.info(err);
          this.sendLogs({
            topic: 'order',
            topicId: orderBeforeUpdate.externalId,
            message: `Internal Server Error`,
            storeId: instance.url,
            logLevel: 'error',
            code: 500,
            payload: { errors: err }
          });
          ctx.meta.$statusCode = 500;
          ctx.meta.$statusMessage = 'Internal Error';
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
      params: {
        order_id: { type: 'string' }
      },
      async handler(ctx) {
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user
        });
        if (!instance.internal_data) {
          if (!instance.internal_data.omsId) {
            ctx.meta.$statusCode = 404;
            ctx.meta.$statusMessage = 'Not Found';
            return {
              message: 'There is no orders for this store!'
            };
          }
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
          createDate: order.date_created,
          knawat_order_status: order.status ? this.normalizeResponseStatus(order.status) : '',
          notes: order.notes,
          shipping_method: order.shipmentCourier,
          shipping_charge: order.shippingCharge
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
      cache: {
        keys: ['#user', 'page', 'limit'],
        ttl: 15 * 60 // 15 mins
      },
      async handler(ctx) {
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user
        });
        if (!instance.internal_data) {
          if (!instance.internal_data.omsId) {
            ctx.meta.$statusCode = 404;
            ctx.meta.$statusMessage = 'Not Found';
            return {
              message: 'There is no orders for this store!'
            };
          }
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
          status: this.normalizeResponseStatus(order.status),
          createDate: order.createDate,
          updateDate: order.updateDate,
          total: order.total,
          knawat_order_status: order.status ? this.normalizeResponseStatus(order.status) : ''
        }));
      }
    },
    deleteOrder: {
      auth: 'Bearer',
      params: {
        id: { type: 'string', convert: true }
      },
      async handler(ctx) {
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user
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
            this.logger.info(result);
            if (result.salesorder) {
              return {
                status: 'success',
                data: {
                  order_id: ctx.params.id
                }
              };
            }
            this.sendLogs({
              topic: 'order',
              topicId: ctx.params.id,
              message: `Internal Server Error`,
              storeId: instance.url,
              logLevel: 'error',
              code: 500,
              payload: { errors: result }
            });
            ctx.meta.$statusCode = 500;
            ctx.meta.$statusMessage = 'Internal Error';
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
              topic: 'order',
              topicId: ctx.params.id,
              message: `Internal Server Error`,
              storeId: instance.url,
              logLevel: 'error',
              code: 500,
              payload: { errors: err }
            });
            ctx.meta.$statusCode = 500;
            ctx.meta.$statusMessage = 'Internal Error';
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
    async currentSubscriptions(instance) {
      // Getting the user Information to check subscription
      const [user] = await fetch(
        `${process.env.KLAYER_URL}/api/Partners?filter=${JSON.stringify({
          where: {
            contact_email: instance.users.filter((usr: StoreUser) => usr.roles.includes('owner'))[0]
              .email
          }
        })}&access_token=dbbf3cb7-f7ad-46ce-bee3-4fd7477951c4`,
        { method: 'get' }
      ).then(res => res.json());
      const max: Subscription[] = [];
      let lastDate = new Date(0);
      user.subscriptions.forEach((subscription: Subscription) => {
        if (new Date(subscription.expire_date) > lastDate) {
          max.push(subscription);
          lastDate = new Date(subscription.expire_date);
        }
      });
      return max.pop();
    },
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
    normalizeUpdateRequestStatus(status) {
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
    normalizeAddress(address) {
      Object.keys(address).forEach(key => {
        if (address[key] === '' || undefined) delete address[key];
      });
      return address;
    },
    sendLogs({ topic, topicId, message, storeId, logLevel, code, payload }) {
      const body = {
        topic,
        topicId: JSON.stringify(topicId),
        message,
        storeId,
        logLevel,
        code,
        payload
      };
      return this.broker.call('logs.add', { ...body });
    },
    warningsMessenger(
      outOfStock,
      notEnoughStock,
      data,
      instance,
      shippingMethod,
      shipping,
      shipment
    ) {
      const warnings = [];
      try {
        if (outOfStock.length > 0) {
          warnings.push({
            message: `This items are out of stock ${outOfStock}`,
            skus: outOfStock,
            code: 1102
          });
          this.sendLogs({
            topic: 'order',
            topicId: data.externalId,
            message: `This items are out of stock ${outOfStock}`,
            storeId: instance.url,
            logLevel: 'warn',
            code: 1102
          });
        }
        if (notEnoughStock.length > 0) {
          warnings.push({
            message: `This items quantities are not enough stock ${outOfStock}`,
            skus: notEnoughStock,
            code: 1103
          });
          this.sendLogs({
            topic: 'order',
            topicId: data.externalId,
            message: `This items quantities are not enough stock ${outOfStock}`,
            storeId: instance.url,
            logLevel: 'warn',
            code: 1103
          });
        }
        if ((!instance.shipping_methods || !instance.shipping_methods[0].name) && !shippingMethod) {
          warnings.push({
            message: `There is no default shipping method for your store, It’ll be shipped with ${shipment.courier ||
              'PTT'}, Contact our customer support for more info`,
            code: 2102
          });
          this.sendLogs({
            topic: 'order',
            topicId: data.externalId,
            message: `There is no default shipping method for your store, It’ll be shipped with ${shipment.courier ||
              'PTT'}`,
            storeId: instance.url,
            logLevel: 'warn',
            code: 2102
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
              'PTT'}, Contact our customer support for more info`,
            code: 2101
          });
          this.sendLogs({
            topic: 'order',
            topicId: data.externalId,
            message: `Can’t ship to ${
              shipping.country
            } with provided courier, It’ll be shipped with ${shipment.courier ||
              'PTT'}, Contact our customer support for more info`,
            storeId: instance.url,
            logLevel: 'warn',
            code: 2101
          });
        }
      } catch (err) {
        this.logger.error(err);
      }
      return warnings;
    }
  }
};

export = TheService;
