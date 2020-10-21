import { Context, Errors, GenericObject, ServiceSchema } from 'moleculer';

import { PaymentsOpenapi } from '../utilities/mixins/openapi';
import { Payment, PaymentInvoice } from '../utilities/types';
import { PaymentsValidation } from '../utilities/mixins/validation';
import { Oms } from '../utilities/mixins/oms.mixin';
import { MpError } from '../utilities/adapters';
import { CheckoutPage } from '../utilities/mixins';
import { sanitizeData } from '../utilities/lib';

const TheService: ServiceSchema = {
  name: 'payments',
  mixins: [PaymentsValidation, PaymentsOpenapi, Oms, CheckoutPage],
  actions: {
    add: {
      auth: ['Basic'],
      async handler(ctx: Context) {
        const instance = await ctx.call('stores.findInstance', {
          id: ctx.params.id,
        });

        // create OMS contact if no oms ID
        if (!instance?.internal_data?.omsId) {
          await this.setOmsId(instance);
        }

        const paymentBody: any = {
          customerId: instance?.internal_data?.omsId,
          paymentMode: ctx.params.payment_mode,
          amount: ctx.params.amount,
          accountId: ctx.params.account_id,
        };

        if (ctx.params.invoices) {
          paymentBody.invoices = ctx.params.invoices.map(
            (invoice: { [key: string]: string }) => ({
              invoiceId: invoice.invoice_id,
              amountApplied: invoice.amount_applied,
            })
          );
        }

        if (ctx.params.bank_charges) {
          paymentBody.bankCharges = ctx.params.bank_charges;
        }

        if (ctx.params.reference) {
          paymentBody.referenceNumber = String(ctx.params.reference);
        }

        if (ctx.params.description) {
          paymentBody.description = ctx.params.description;
        }

        return ctx.call('oms.createPayment', paymentBody).then(
          res => {
            // Store balance
            this.broker.cacher.clean(`payments.get:${instance.consumer_key}**`);
            this.broker.cacher.clean(`invoices.get:${instance.consumer_key}**`);
            this.cacheUpdate(res.payment, instance);
            return this.sanitizePayment(res.payment);
          },
          err => {
            throw new MpError('Payments Service', err.message, err.code || 500);
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
      async handler(ctx: Context) {
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
            .call('oms.listPayments', {
              customerId: store.internal_data.omsId,
              ...queryParams,
            })
            .then(
              res => ({ payments: res.payments.map(this.sanitizePayment) }),
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

    checkout: {
      auth: ['Hmac'],
      async handler(
        ctx: Context<{ gateway: string; }, GenericObject>
      ): Promise<string> {
        const { gateway } = ctx.params;
        const { store } = ctx.meta;

        const res = await ctx.call('cards.list', { store: store.url, gateway });

        // Clean store data
        const sanitizedStore = sanitizeData(
          ['url', 'external_data', 'credit'],
          store
        );

        // Clean cards data
        const sanitizedCards = res.cards.map((card: GenericObject) =>
          sanitizeData(
            ['_id', 'currency', 'number', 'primary', 'title', 'expires'],
            card
          )
        );

        ctx.meta.$responseType = 'text/html';
        return this.renderCheckoutPage({
          cards: sanitizedCards,
          store: sanitizedStore,
        });
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
    async cacheUpdate(payment, instance) {
      const store = await this.broker.call('stores.sGet', { id: instance.url });
      store.credit = (store.credit || 0) + payment.amount;
      this.broker.cacher.set(`stores.sGet:${store.url}|undefined`, store);
      this.broker.cacher.set(`stores.me:${store.consumer_key}`, store);
    },
  },
};

export = TheService;
