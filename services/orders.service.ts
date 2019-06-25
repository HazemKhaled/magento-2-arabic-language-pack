import { Context, ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';
import { v1 as uuidv1 } from 'uuid';
import { OrdersOperations } from '../utilities/mixins/orders.mixin';
import { OMSResponse, OrderItem } from '../utilities/types/order.type';
import { Product, Variation } from '../utilities/types/product.type';
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
        if (ctx.params.shipping.company !== 'ebay') ctx.params.id = uuidv1();

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
            ? { id: instance.internalData.omsId }
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
        data.items = stock.inStock;
        // Shipping
        const shipment = await this.shipment(
          stock.products,
          stock.enoughStock,
          ctx.params.shipping.country,
          instance,
          ctx.params.shipping_method
        );
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
        this.logger.info(JSON.stringify(result));
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
    }
  }
};

export = TheService;
