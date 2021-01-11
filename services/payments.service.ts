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
  actions: {
    add: {
      auth: ['Basic'],
      async handler(
        ctx: Context<PaymentRequestParams>
      ): Promise<PaymentResponse> {
        const instance = await ctx.call<Store, { url: string }>('stores.get', {
          url: ctx.params.id,
        });

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
            (invoice: { invoice_id: string; amount_applied: number }) => ({
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
          .call<{ payment: Payment }, Partial<Payment>>(
            'oms.createPayment',
            paymentBody
          )
          .then(
            async ({ payment }) => {
              // Clear cache
              this.broker.cacher.clean(
                `payments.get:${instance.consumer_key}**`
              );
              this.broker.cacher.clean(
                `subscription.getByStore:${instance.url}*`
              );
              this.broker.cacher.clean(`stores.get:${instance.url}**`);
              await this.cacheUpdate(payment, instance);
              return this.sanitizePayment(payment);
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
      const store = await this.broker.call('stores.get', {
        url: instance.url,
      });

      store.credit = (store.credit || 0) + payment.amount;
      this.broker.cacher.set(`stores.get:${store.url}|undefined`, store);
      this.broker.cacher.set(`stores.me:${store.consumer_key}`, store);
    },
  },
};

export = TheService;
