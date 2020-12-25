import { Context, ServiceSchema, GenericObject } from 'moleculer';

import { PaymentsOpenapi } from '../utilities/mixins/openapi';
import {
  Payment,
  PaymentInvoice,
  PaymentRequestParams,
  MetaParams,
  Store,
  PaymentResponse,
} from '../utilities/types';
import { PaymentsValidation } from '../utilities/mixins/validation';
import { Oms } from '../utilities/mixins/oms.mixin';
import { MpError } from '../utilities/adapters';

const TheService: ServiceSchema = {
  name: 'payments',
  mixins: [PaymentsValidation, PaymentsOpenapi, Oms],
  events: {
    'payment.event': {
      group: 'other',
      handler(
        ctx: Context<{ consumer_key: string; url: string; credit: number }>
      ): void {
        // Clear cache
        ctx.broker.cacher.clean(`payments.get:${ctx.params.consumer_key}**`);
        ctx.broker.cacher.clean(`invoices.get:${ctx.params.consumer_key}**`);

        ctx.broker.cacher.clean(`orders.getOrder:${ctx.params.consumer_key}*`);
        ctx.broker.cacher.clean(
          `orders.list:undefined|${ctx.params.consumer_key}*`
        );
        ctx.broker.cacher.clean(`invoices.get:${ctx.params.consumer_key}*`);
        ctx.broker.cacher.clean(`subscription.getByStore:${ctx.params.url}*`);
        ctx.broker.cacher.clean(`stores.getOne:${ctx.params.url}**`);
        ctx.broker.cacher.clean(`stores.me:${ctx.params.consumer_key}**`);
      },
    },
  },
  actions: {
    add: {
      auth: ['Basic'],
      async handler(
        ctx: Context<PaymentRequestParams>
      ): Promise<PaymentResponse> {
        const instance = await ctx.call<Store, { id: string }>('stores.get', {
          id: ctx.params.id,
        });
        if (instance) {
          instance.url = instance._id || ctx.params.id;
        }

        // create OMS contact if no oms ID
        if (!instance?.internal_data?.omsId) {
          await this.setOmsId(instance);
        }

        const paymentBody: GenericObject = {
          customerId: instance?.internal_data?.omsId,
          payment_mode: ctx.params.payment_mode,
          amount: ctx.params.amount,
          account_id: ctx.params.account_id,
        };

        if (ctx.params.invoices) {
          paymentBody.invoices = ctx.params.invoices.map(
            (invoice: { [key: string]: string }) => ({
              invoice_id: invoice.invoice_id,
              amount_applied: invoice.amount_applied,
            })
          );
        }

        if (ctx.params.bank_charges) {
          paymentBody.bank_charges = ctx.params.bank_charges;
        }

        if (ctx.params.reference) {
          paymentBody.reference = String(ctx.params.reference);
        }

        if (ctx.params.description) {
          paymentBody.description = ctx.params.description;
        }

        return ctx
          .call<GenericObject, Partial<Payment>>(
            'oms.createPayment',
            paymentBody
          )
          .then(
            async (res: GenericObject) => {
              await this.broker.emit('payment.event', instance);
              await this.cacheUpdate(res.payment, instance);
              return this.sanitizePayment(res.payment);
            },
            err => {
              throw new MpError(
                'Payments Service',
                err.message,
                err.code || 500
              );
            }
          );
      },
    },
    get: {
      auth: ['Bearer'],
      cache: {
        keys: ['#user', 'page', 'limit', 'reference_number', 'payment_mode'],
        ttl: 60 * 60 * 24,
      },
      async handler(
        ctx: Context<GenericObject, MetaParams>
      ): Promise<{ payments: Payment[] }> {
        const { store } = ctx.meta;
        const keys: { [key: string]: string } = {
          page: 'page',
          limit: 'perPage',
          reference_number: 'referenceNumber',
          payment_mode: 'paymentMode',
        };
        const queryParams: { [key: string]: string } = {};
        Object.keys(ctx.params).forEach(key => {
          queryParams[keys[key]] = ctx.params[key];
        });

        if (store?.internal_data?.omsId) {
          return ctx
            .call<PaymentResponse, Partial<Payment>>('oms.listPayments', {
              customerId: store.internal_data.omsId,
              ...queryParams,
            })
            .then(
              (res: PaymentResponse) => ({
                payments: res.payments.map(this.sanitizePayment),
              }),
              err => {
                throw new MpError(
                  'Payments Service',
                  err.message,
                  err.code || 500
                );
              }
            );
        }

        throw new MpError(
          'Payments Service',
          'No Record Found For This Store!',
          404
        );
      },
    },
  },
  methods: {
    sanitizePayment(payment: Payment): PaymentResponse {
      return Object({
        store_id: payment.storeId,
        payment_mode: payment.paymentMode,
        amount: payment.amount,
        invoices:
          payment.invoices &&
          payment.invoices.map((invoice: PaymentInvoice) => ({
            amount_applied: invoice.amountApplied,
            invoice_id: invoice.invoiceId,
          })),
        bank_charges: payment.bankCharges,
        account_id: payment.accountId,
        account_name: payment.accountName,
        payment_id: payment.paymentId,
        unused_amount: payment.unusedAmount,
        reference: payment.referenceNumber,
        description: payment.description,
        date: payment.date,
      });
    },
    async cacheUpdate(payment, instance): Promise<void> {
      const store = await this.broker.call('stores.getOne', {
        id: instance.url,
      });
      store.url = store.url || store._id;

      store.credit = (store.credit || 0) + payment.amount;
      this.broker.cacher.set(`stores.getOne:${store.url}|undefined`, store);
      this.broker.cacher.set(`stores.me:${store.consumer_key}`, store);
    },
  },
};

export = TheService;
