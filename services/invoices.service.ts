import { Context, Errors, ServiceSchema } from 'moleculer';
import { InvoicesOpenapi } from '../utilities/mixins/openapi';
import { Invoice } from '../utilities/types';
import { CreateInvoiceValidation } from '../utilities/validations';
const MoleculerError = Errors.MoleculerError;

const TheService: ServiceSchema = {
  name: 'invoices',
  mixins: [InvoicesOpenapi],
  actions: {
    get: {
      auth: 'Bearer',
      cache: {
        keys: ['#user', 'page', 'limit', 'reference_number', 'invoice_number'],
        ttl: 60 * 60
      },
      params: {
        page: { type: 'number', integer: true, optional: true, convert: true },
        limit: { type: 'number', integer: true, optional: true, convert: true },
        reference_number: { type: 'string', optional: true },
        invoice_number: { type: 'string', optional: true }
      },
      async handler(ctx: Context) {
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user
        });
        const keys: { [key: string]: string } = {
          page: 'page',
          limit: 'perPage',
          reference_number: 'referenceNumber',
          invoice_number: 'invoiceNumber'
        };
        const queryParams: { [key: string]: string } = {};
        Object.keys(ctx.params).forEach(key => {
          if (ctx.params[key]) queryParams[keys[key]] = ctx.params[key];
        });
        if (instance.internal_data && instance.internal_data.omsId) {
          return ctx
            .call('oms.listInvoice', {
              omsId: instance.internal_data.omsId,
              queryParams
            })
            .then(
              async response => {
                return {
                  invoices: response.invoices.map((invoice: Invoice) =>
                    this.invoiceSanitize(invoice)
                  )
                };
              },
              err => {
                throw new MoleculerError(err.message, err.code || 500);
              }
            );
        }
        throw new MoleculerError('No Record Found For This Store!', 404);
      }
    },
    create: {
      auth: 'Basic',
      params: CreateInvoiceValidation,
      async handler(ctx: Context) {
        const instance = await ctx.call('stores.findInstance', {
          id: ctx.params.storeId
        });
        if (instance.errors) {
          throw new MoleculerError('Store not found', 404);
        }
        return ctx
          .call('oms.createInvoice', {
            customerId: instance.internal_data.omsId,
            discount: ctx.params.discount && ctx.params.discount.value,
            discountType: ctx.params.discount && ctx.params.discount.type,
            items: ctx.params.items
          })
          .then(
            res => {
              this.broker.cacher.clean(`invoices.get:${instance.consumer_key}*`);
              return res;
            },
            err => {
              throw new MoleculerError(err.message, err.code || 500);
            }
          );
      }
    },
    applyCredits: {
      auth: 'Bearer',
      params: {
        id: { type: 'string' }
      },
      async handler(ctx: Context) {
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user
        });
        if (instance.errors) {
          throw new MoleculerError('Store not found', 404);
        }
        return ctx
          .call('oms.applyInvoiceCredits', {
            customerId: instance.internal_data.omsId,
            invoiceId: ctx.params.id
          })
          .then(
            res => {
              this.broker.cacher.clean(`invoices.get:${instance.consumer_key}*`);
              this.broker.cacher.clean(`stores.get:${instance.url}*`);
              this.broker.cacher.clean(`stores.me:${instance.consumer_key}*`);
              return res;
            },
            err => {
              throw new MoleculerError(err.message, err.code || 500);
            }
          );
      }
    },
    createOrderInvoice: {
      params: {
        storeId: { type: 'string' },
        orderId: { type: 'string' }
      },
      async handler(ctx: Context) {
        const instance = await ctx.call('stores.findInstance', {
          id: ctx.params.storeId
        });
        return ctx
          .call('oms.createSalesOrderInvoice', {
            customerId: instance.internal_data.omsId,
            orderId: ctx.params.orderId
          })
          .then(null, err => {
            throw new MoleculerError(err.message, err.code || 500);
          });
      }
    },
    markInvoiceSent: {
      params: {
        omsId: { type: 'string' },
        invoiceId: { type: 'string' }
      },
      handler(ctx: Context) {
        return ctx
          .call('oms.markInvoiceToSent', {
            customerId: ctx.params.omsId,
            invoiceId: ctx.params.invoiceId
          })
          .then(null, err => {
            throw new MoleculerError(err.message, err.code || 500);
          });
      }
    }
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
        adjustment: invoice.adjustment
      };
    }
  }
};

export = TheService;
