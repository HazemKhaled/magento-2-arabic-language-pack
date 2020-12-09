import { Context, Errors, ServiceSchema } from 'moleculer';

import { InvoicesOpenapi } from '../utilities/mixins/openapi';
import {
  Invoice,
  InvoiceRequestParams,
  DynamicRequestParams,
  MetaParams,
  Store,
  Order,
  OrderRequestParams,
  StoreRequest,
  InvoiceResponse,
} from '../utilities/types';
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
      auth: ['Bearer'],
      cache: {
        keys: ['#user', 'page', 'limit', 'reference_number', 'invoice_number'],
        ttl: 60,
      },
      handler(
        ctx: Context<DynamicRequestParams, MetaParams>
      ): Promise<{ invoices: Invoice[] }> {
        const { store } = ctx.meta;

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

        return ctx
          .call<
            { response: { invoices: Invoice[] } },
            Partial<InvoiceRequestParams>
          >('oms.listInvoice', {
            omsId: store?.internal_data?.omsId,
            ...queryParams,
          })
          .then(
            async ({ response: { invoices } }) => {
              return {
                invoices: invoices.map((invoice: Invoice) =>
                  this.invoiceSanitize(invoice)
                ),
              };
            },
            err => {
              throw new MoleculerError(err.message, err.code || 500);
            }
          );
      },
    },
    create: {
      auth: ['Basic'],
      async handler(ctx: Context<InvoiceRequestParams>): Promise<unknown> {
        const instance: Store = await ctx.call<Store, Partial<Store>>(
          'stores.findInstance',
          {
            id: ctx.params.storeId,
          }
        );

        if (instance.errors) {
          throw new MoleculerError('Store not found', 404);
        }

        const { items, discount } = ctx.params;
        // Total items cost
        const itemsCost = items.reduce(
          (aa: number, i: { rate: number }) => (aa += i.rate),
          0
        );
        const totalBeforeTax = itemsCost - (discount?.value || 0);

        if (totalBeforeTax === 0) {
          return {
            invoice: {
              invoiceId: '00000',
            },
          };
        }

        // create OMS contact if no oms ID
        if (!instance?.internal_data?.omsId) {
          await this.setOmsId(instance);
        }

        const invoiceParams: { [key: string]: string } = {
          customerId: instance?.internal_data?.omsId,
          discount: ctx.params.discount?.value.toString(),
          discountType: ctx.params.discount?.type,
          items: ctx.params.items,
        };

        if (ctx.params.coupon) {
          invoiceParams.coupon = ctx.params.coupon;
        }

        if (ctx.params.dueDate) {
          invoiceParams.dueDate = ctx.params.dueDate;
        }

        return ctx
          .call<Invoice, Partial<InvoiceRequestParams>>(
            'oms.createInvoice',
            invoiceParams
          )
          .then(
            async (res: Invoice) => {
              await this.broker.cacher.clean(
                `invoices.get:${instance.consumer_key}**`
              );
              this.cacheUpdate(res.invoice, instance);
              return res;
            },
            err => {
              throw new MoleculerError(err.message, err.code || 500);
            }
          );
      },
    },
    updateInvoiceStatus: {
      handler(
        ctx: Context<Partial<InvoiceRequestParams>>
      ): Promise<{ code?: number; message: string }> {
        return ctx.call<
          { code?: number; message: string },
          Partial<InvoiceRequestParams>
        >('oms.updateInvoiceStatus', ctx.params);
      },
    },
    applyCredits: {
      auth: ['Bearer'],
      async handler(
        ctx: Context<Partial<InvoiceRequestParams>>
      ): Promise<InvoiceResponse> {
        const store: Store = await ctx.call<Store>('stores.me');

        const { params } = ctx;
        if (
          params.useSavedPaymentMethods &&
          store.credit < params.paymentAmount
        ) {
          if (process.env.PAYMENT_AUTO_CHARGE_CC_INVOICE) {
            await ctx
              .call<void, Partial<StoreRequest>>('paymentGateway.charge', {
                storeId: store.url,
                amount: params.paymentAmount - store.credit,
              })
              .then(null, err => {
                if (err.type === 'SERVICE_NOT_FOUND')
                  throw new MpError(
                    'Invoices Service',
                    'Not enough balance!',
                    402
                  );
                throw err;
              });
          } else {
            throw new MpError('Invoices Service', 'Not enough balance!', 402);
          }
        }

        return ctx
          .call<InvoiceResponse, Partial<InvoiceRequestParams>>(
            'oms.applyInvoiceCredits',
            {
              customerId: store?.internal_data?.omsId,
              invoiceId: ctx.params.id,
            }
          )
          .then(
            res => {
              this.broker.cacher.clean(`invoices.get:${store.consumer_key}*`);
              this.broker.cacher.clean(`stores.getOne:${store.url}*`);
              this.broker.cacher.clean(`stores.me:${store.consumer_key}*`);
              this.broker.cacher.clean(`payments.get:${store.consumer_key}**`);
              return res;
            },
            err => {
              throw new MpError(
                'invoices Service',
                err.message,
                err.code || 500
              );
            }
          );
      },
    },
    createOrderInvoice: {
      async handler(
        ctx: Context<InvoiceRequestParams>
      ): Promise<{ invoice: Invoice; code?: number; message?: string }> {
        const instance: Store = await ctx.call<Store, Partial<Store>>(
          'stores.findInstance',
          {
            id: ctx.params.storeId,
          }
        );

        return ctx
          .call<null, Partial<InvoiceRequestParams>>(
            'oms.createSalesOrderInvoice',
            {
              customerId: instance?.internal_data?.omsId,
              orderId: ctx.params.orderId,
            }
          )
          .then(null, err => {
            throw new MoleculerError(err.message, err.code || 500);
          });
      },
    },
    markInvoiceSent: {
      handler(
        ctx: Context<InvoiceRequestParams>
      ): Promise<{ code: number; message: string }> {
        return ctx
          .call<InvoiceResponse, Partial<InvoiceRequestParams>>(
            'oms.markInvoiceToSent',
            {
              customerId: ctx.params.omsId,
              invoiceId: ctx.params.invoiceId,
            }
          )
          .then(null, err => {
            throw new MoleculerError(err.message, err.code || 500);
          });
      },
    },
    renderInvoice: {
      params: {},
      async handler(
        ctx: Context<InvoiceRequestParams, MetaParams>
      ): Promise<unknown> {
        const store: Store = await ctx.call<Store, Partial<Store>>(
          'stores.findInstance',
          {
            id: ctx.params.storeId,
          }
        );
        const orders: Order[] = await ctx.call<Order[], Partial<Order>>(
          'orders.list',
          {
            externalId: ctx.params.id,
          }
        );
        const order: Order = await ctx.call<Order, Partial<OrderRequestParams>>(
          'orders.getOrder',
          {
            order_id: orders[0].id,
          }
        );
        ctx.meta.$responseType = 'text/html';
        return this.renderInvoice(store, order);
      },
    },
  },
  methods: {
    invoiceSanitize(invoice): Partial<Invoice> {
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
    async cacheUpdate(invoice, instance): Promise<void> {
      const invoices = { invoices: [this.invoiceSanitize(invoice)] };
      this.broker.cacher.set(
        `invoices.get:${instance.consumer_key}|undefined|undefined|${invoice.referenceNumber}|undefined`,
        invoices
      );
      this.broker.cacher.set(
        `invoices.get:${instance.consumer_key}|undefined|undefined|undefined|${invoice.invoiceNumber}`,
        invoices
      );
    },
  },
};

export = TheService;
