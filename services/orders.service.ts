import { Context, ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';
import { v1 as uuidv1 } from 'uuid';
import { OrdersOperations } from '../utilities/mixins/orders.mixin';
import { OMSResponse, Order, OrderItem } from '../utilities/types/order.type';
import { Product } from '../utilities/types/product.type';
import { StoreUser } from '../utilities/types/store.type';
import { Subscription } from '../utilities/types/user.type';
import { createOrderValidation } from '../utilities/validations/orders.validate';

const TheService: ServiceSchema = {
  name: 'orders',
  mixins: [OrdersOperations],
  settings: {
    AUTH: Buffer.from(`${process.env.BASIC_USER}:${process.env.BASIC_PASS}`).toString('base64')
  },
  actions: {
    createOrder: {
      auth: 'Bearer',
      params: createOrderValidation,
      async handler(ctx: Context) {
        ctx.params.externalId = uuidv1();
        if (ctx.params.shipping.company === 'ebay') ctx.params.externalId = ctx.params.id;

        const data = ctx.params;
        data.externalInvoice = 'https://www.example.com';
        if (ctx.params.invoice_url) {
          data.externalInvoice = ctx.params.invoice_url;
        }
        const instance = await ctx.call('stores.findInstance', {
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
        data.store =
          instance.internal_data && instance.internal_data.omsId
            ? { id: instance.internal_data.omsId }
            : { url: instance.url, name: instance.name };
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

        if (!shipment) {
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
        const result: OMSResponse = await fetch(`${process.env.OMS_BASEURL}/orders`, {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            Authorization: `Basic ${this.settings.AUTH}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        }).then(createResponse => createResponse.json());

        if (!result.order) {
          ctx.meta.$statusCode = 500;
          ctx.meta.$statusMessage = 'Internal Error';
          return {
            errors: [
              {
                status: 'fail',
                name: 'Internal Server Error'
              }
            ]
          };
        }
        if (result.order && (!instance.internal_data || !instance.internal_data.omsId)) {
          ctx.call('stores.update', {
            id: instance.url,
            internal_data: {
              omsId: result.order.store.id
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
        const order = result.order;
        const message: {
          status?: string;
          data?: OMSResponse['order'] | any; // Remove any after
          warnings?: Array<{}>;
          errors?: Array<{}>;
        } = {
          status: 'success',
          data: {
            id: order.id,
            status: order.status,
            items: order.items,
            billing: order.billing,
            shipping: order.shipping,
            createDate: order.createDate,
            notes: order.notes || ''
          }
        };
        const outOfStock = stock.orderItems.filter(
          (item: OrderItem) => !stock.inStock.map((i: OrderItem) => i.sku).includes(item)
        );
        const notEnoughStock = stock.inStock.filter(
          (item: OrderItem) => !stock.enoughStock.map((i: OrderItem) => i.sku).includes(item.sku)
        );

        // Initializing warnings array if we have a Warning
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
          status: order.status,
          items: order.items,
          billing: order.billing,
          shipping: order.shipping,
          total: order.total,
          createDate: order.date_created,
          knawat_order_status:
            order.knawat_status || order.state || order.status
              ? this.getStatusName(order.knawat_status || order.state || order.status)
              : '',
          notes: order.notes
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
                orderResponse[meta.key.substring(1)] = this.getStatusName(meta.value) || '';
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
          status: order.status,
          createDate: order.createDate,
          updateDate: order.updateDate,
          total: order.total,
          knawat_order_status:
            order.knawat_status || order.state || order.status
              ? this.getStatusName(order.knawat_status || order.state || order.status)
              : ''
        }));
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
    /**
     * Get Status Name
     *
     * @param {string} status
     * @returns {string}Status Name
     */
    getStatusName(status: string = 'Order Placed'): string {
      const stateNames: { [key: string]: string } = {
        draft: 'Order Placed',
        sent: 'Sent',
        on_hold: 'On-hold',
        sale: 'Processing',
        shipped: 'Shipped',
        done: 'Shipped',
        cancel: 'Cancelled',
        cancelled: 'Cancelled',
        error: '...'
      };

      return stateNames[status];
    }
  }
};

export = TheService;
