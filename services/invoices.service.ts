import { Context, Errors, ServiceSchema, GenericObject } from 'moleculer';
import { InvoicesOpenapi } from '../utilities/mixins/openapi';
import { Invoice } from '../utilities/types';
import { InvoicesValidation } from '../utilities/mixins/validation';
import { InvoicePage } from '../utilities/mixins/invoicePage';
import { Oms } from '../utilities/mixins/oms.mixin';
import { MpError } from '../utilities/adapters';
const MoleculerError = Errors.MoleculerError;

const TheService: ServiceSchema = {
  name: 'invoices',
  mixins: [InvoicesValidation, InvoicesOpenapi, InvoicePage, Oms],
  actions: {
    get: {
      auth: 'Bearer',
      cache: {
        keys: ['#user', 'page', 'limit', 'reference_number', 'invoice_number'],
        ttl: 60,
      },
      async handler(ctx: Context) {
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user,
        });
        const keys: { [key: string]: string } = {
          page: 'page',
          limit: 'perPage',
          reference_number: 'referenceNumber',
          invoice_number: 'invoiceNumber',
        };
        const queryParams: { [key: string]: string } = {};
        Object.keys(ctx.params).forEach(key => {
          if (ctx.params[key]) queryParams[keys[key]] = ctx.params[key];
        });
        if (instance.internal_data && instance.internal_data.omsId) {
          return ctx
            .call('oms.listInvoice', {
              omsId: instance.internal_data.omsId,
              ...queryParams,
            })
            .then(
              async response => {
                return {
                  invoices: response.invoices.map((invoice: Invoice) =>
                    this.invoiceSanitize(invoice),
                  ),
                };
              },
              err => {
                throw new MoleculerError(err.message, err.code || 500);
              },
            );
        }
        return [];
      },
    },
    create: {
      auth: 'Basic',
      async handler(ctx: Context) {
        const instance = await ctx.call('stores.findInstance', {
          id: ctx.params.storeId,
        });

        if (instance.errors) {
          throw new MoleculerError('Store not found', 404);
        }

        const { items, discount } = ctx.params;
        // Total items cost
        const itemsCost = items.reduce((a: number, i: GenericObject) => a+=i.rate, 0);
        const totalBeforeTax = itemsCost - ((discount && discount.value) || 0);

        if (totalBeforeTax === 0) {
          return {
            invoice: {
              invoiceId: '00000',
            },
          };
        }

        // create OMS contact if no oms ID
        if (!instance.internal_data || !instance.internal_data.omsId) {
          await this.setOmsId(instance);
        }

        const invoiceParams: {[key:string]: string} = {
          customerId: instance.internal_data.omsId,
          discount: ctx.params.discount && ctx.params.discount.value,
          discountType: ctx.params.discount && ctx.params.discount.type,
          items: ctx.params.items,
        };

        if (ctx.params.coupon) {
          invoiceParams.coupon = ctx.params.coupon;
        }

        return ctx
          .call('oms.createInvoice', invoiceParams)
          .then(
            async res => {
              await this.broker.cacher.clean(`invoices.get:${instance.consumer_key}**`);
              this.cacheUpdate(res.invoice, instance);
              return res;
            },
            err => {
              throw new MoleculerError(err.message, err.code || 500);
            },
          );
      },
    },
    applyCredits: {
      auth: 'Bearer',
      async handler(ctx: Context) {
        const instance = await ctx.call('stores.me');
        if (instance.errors) {
          throw new MpError('Invoices Service', 'Store not found', 404);
        }
        const {params} = ctx;
        if(params.useSavedPaymentMethods && instance.credit < params.paymentAmount) {
          if (process.env.PAYMENT_AUTO_CHARGE_CC_INVOICE) {
            await ctx.call('paymentGateway.charge', {
              storeId: instance.url,
              amount: params.paymentAmount - instance.credit,
            }).then(null, err => {
              if (err.type === 'SERVICE_NOT_FOUND')
                throw new MpError('Invoices Service', 'Not enough balance!', 402);
              throw err;
            });
          } else {
            throw new MpError('Invoices Service', 'Not enough balance!', 402);
          }
        }
        return ctx
          .call('oms.applyInvoiceCredits', {
            customerId: instance.internal_data.omsId,
            invoiceId: ctx.params.id,
          })
          .then(
            res => {
              this.broker.cacher.clean(`invoices.get:${instance.consumer_key}*`);
              this.broker.cacher.clean(`stores.sGet:${instance.url}*`);
              this.broker.cacher.clean(`stores.me:${instance.consumer_key}*`);
              this.broker.cacher.clean(`payments.get:${instance.consumer_key}**`);
              return res;
            },
            err => {
              throw new MpError('invoices Service', err.message, err.code || 500);
            },
          );
      },
    },
    createOrderInvoice: {
      async handler(ctx: Context) {
        const instance = await ctx.call('stores.findInstance', {
          id: ctx.params.storeId,
        });
        return ctx
          .call('oms.createSalesOrderInvoice', {
            customerId: instance.internal_data.omsId,
            orderId: ctx.params.orderId,
          })
          .then(null, err => {
            throw new MoleculerError(err.message, err.code || 500);
          });
      },
    },
    markInvoiceSent: {
      handler(ctx: Context) {
        return ctx
          .call('oms.markInvoiceToSent', {
            customerId: ctx.params.omsId,
            invoiceId: ctx.params.invoiceId,
          })
          .then(null, err => {
            throw new MoleculerError(err.message, err.code || 500);
          });
      },
    },
    renderInvoice: {
      params: {},
      async handler(ctx: Context) {
        const store = await ctx.call('stores.findInstance', { id: ctx.params.storeId });
        ctx.meta.user = store.consumer_key;
        const orders = await ctx.call('orders.list', {
          externalId: ctx.params.id,
        });
        const order = await ctx.call('orders.getOrder', {
          order_id: orders[0].id,
        });
        ctx.meta.$responseType = 'text/html';
        return this.renderInvoice(store, order);
      },
    },
  },
  methods: {
    invoiceSanitize(invoice) {
      return {
        invoice_id: invoice.invoiceId,
        customer_name: invoice.customerName,
        customer_id: invoice.customerId,
        status: invoice.status,
        invoice_number: invoice.invoiceNumber,
        reference_number: invoice.referenceNumber,
        date: invoice.date,
        due_date: invoice.dueDate,
        due_days: invoice.dueDays,
        total: invoice.total,
        balance: invoice.balance,
        created_time: invoice.createdTime,
        last_modified_time: invoice.lastModifiedTime,
        shipping_charge: invoice.shippingCharge,
        adjustment: invoice.adjustment,
        coupon: invoice.coupon,
      };
    },
    async cacheUpdate(invoice, instance) {
      const invoices = { invoices: [this.invoiceSanitize(invoice)] };
      this.broker.cacher.set(`invoices.get:${instance.consumer_key}|undefined|undefined|${invoice.referenceNumber}|undefined`, invoices);
      this.broker.cacher.set(`invoices.get:${instance.consumer_key}|undefined|undefined|undefined|${invoice.invoiceNumber}`, invoices);
    },
  },
};

export = TheService;
