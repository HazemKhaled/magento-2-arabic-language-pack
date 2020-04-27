import { Context, Errors, ServiceSchema } from 'moleculer';
import { PaymentsOpenapi } from '../utilities/mixins/openapi';
import { Payment, PaymentInvoice } from '../utilities/types';
import { PaymentsValidation } from '../utilities/mixins/validation';
import { Oms } from '../utilities/mixins/oms.mixin';
const MoleculerError = Errors.MoleculerError;

const TheService: ServiceSchema = {
  name: 'payments',
  mixins: [PaymentsValidation, PaymentsOpenapi, Oms],
  actions: {
    add: {
      auth: 'Basic',
      async handler(ctx: Context) {
        const instance = await ctx.call('stores.findInstance', {
          id: ctx.params.id,
        });

        // create OMS contact if no oms ID
        if (!instance.internal_data || !instance.internal_data.omsId) {
          await this.setOmsId(instance);
        }

        const paymentBody: any = {
          customerId: instance.internal_data.omsId,
          paymentMode: ctx.params.payment_mode,
          amount: ctx.params.amount,
          accountId: ctx.params.account_id,
        };
        if (ctx.params.invoices) {
          paymentBody.invoices = ctx.params.invoices.map((invoice: { [key: string]: string }) => ({
            invoiceId: invoice.invoice_id,
            amountApplied: invoice.amount_applied,
          }));
        }
        if (ctx.params.bank_charges) {
          paymentBody.bankCharges = ctx.params.bank_charges;
        }
        if (ctx.params.reference) {
          paymentBody.referenceNumber = String(ctx.params.reference);
        }
        return ctx
          .call('oms.createPayment', paymentBody)
          .then(
            res => {
              // Store balance
              this.broker.cacher.clean(`stores.me:${instance.consumer_key}**`);
              this.broker.cacher.clean(`stores.sGet:${instance.url}**`);
              this.broker.cacher.clean(`payments.get:${instance.consumer_key}**`);
              this.broker.cacher.clean(`invoices.get:${instance.consumer_key}**`);
              return this.sanitizePayment(res.payment);
            },
            err => {
              throw new MoleculerError(err.message, err.code || 500);
            },
          );

      },
    },
    get: {
      auth: 'Bearer',
      cache: {
        keys: ['#user', 'page', 'limit', 'reference_number', 'payment_mode'],
        ttl: 60 * 60 * 24,
      },
      async handler(ctx: Context) {
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user,
        });
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
        if (instance.internal_data && instance.internal_data.omsId) {
          return ctx
            .call('oms.listPayments', {
              customerId: instance.internal_data.omsId,
              ...queryParams,
            })
            .then(
              res => ({ payments: res.payments.map(this.sanitizePayment) }),
              err => {
                throw new MoleculerError(err.message, err.code || 500);
              },
            );
        }
        throw new MoleculerError('No Record Found For This Store!', 404);
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
        date: payment.date,
      });
    },
  },
};

export = TheService;
