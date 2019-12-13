import { Context, Errors, ServiceSchema } from 'moleculer';
import { PaymentsOpenapi } from '../utilities/mixins/openapi';
import { Payment, PaymentInvoice } from '../utilities/types';
const MoleculerError = Errors.MoleculerError;

const TheService: ServiceSchema = {
  name: 'payments',
  mixins: [PaymentsOpenapi],
  actions: {
    add: {
      auth: 'Basic',
      params: {
        id: [{ type: 'string' }, { type: 'number', integer: true }],
        payment_mode: { type: 'string' },
        amount: { type: 'number' },
        invoices: {
          type: 'array',
          item: {
            type: 'object',
            props: {
              amount_applied: { type: 'number', convert: true },
              invoice_id: { type: 'string' }
            }
          },
          optional: true
        },
        account_id: { type: 'string' },
        bank_charges: { type: 'number', optional: true, convert: true },
        reference: [
          { type: 'string', optional: true },
          { type: 'number', integer: true, optional: true }
        ]
      },
      async handler(ctx: Context) {
        const instance = await ctx.call('stores.findInstance', {
          id: ctx.params.id
        });
        if (instance.internal_data && instance.internal_data.omsId) {
          return ctx
            .call('oms.createPayment', {
              customerId: instance.internal_data.omsId,
              paymentMode: ctx.params.payment_mode,
              amount: ctx.params.amount,
              invoices: ctx.params.invoices
                ? ctx.params.invoices.map((invoice: { [key: string]: string }) => ({
                  invoiceId: invoice.invoice_id,
                  amountApplied: invoice.amount_applied
                }))
                : undefined,
              accountId: ctx.params.account_id,
              bankCharges: ctx.params.bank_charges,
              referenceNumber: String(ctx.params.reference)
            })
            .then(
              res => {
                // Store balance
                this.broker.cacher.clean(`stores.me:${instance.consumer_key}**`);
                this.broker.cacher.clean(`stores.get:${instance.url}**`);
                this.broker.cacher.clean(`payments.get:${instance.consumer_key}**`);
                this.broker.cacher.clean(`invoices.get:${instance.consumer_key}**`);
                return this.sanitizePayment(res.payment);
              },
              err => {
                throw new MoleculerError(err.message, err.code || 500);
              }
            );
        }
        throw new MoleculerError('No Record Found For This Store!', 404);
      }
    },
    get: {
      auth: 'Bearer',
      cache: {
        keys: ['#user', 'page', 'limit', 'reference_number', 'payment_mode'],
        ttl: 60 * 60
      },
      params: {
        page: { type: 'number', integer: true, optional: true, convert: true },
        limit: { type: 'number', integer: true, optional: true, convert: true },
        reference_number: { type: 'string', optional: true },
        payment_mode: { type: 'string', optional: true }
      },
      async handler(ctx: Context) {
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user
        });
        const keys: { [key: string]: string } = {
          page: 'page',
          limit: 'perPage',
          reference_number: 'reference_number',
          payment_mode: 'payment_mode'
        };
        const queryParams: { [key: string]: string } = {};
        Object.keys(ctx.params).forEach(key => {
          if (ctx.params[key]) queryParams[keys[key]] = ctx.params[key];
        });
        if (instance.internal_data && instance.internal_data.omsId) {
          return ctx
            .call('oms.listPayments', {
              customerId: instance.internal_data.omsId,
              queryParams
            })
            .then(
              res => ({ payments: res.payments.map(this.sanitizePayment) }),
              err => {
                throw new MoleculerError(err.message, err.code || 500);
              }
            );
        }
        throw new MoleculerError('No Record Found For This Store!', 404);
      }
    }
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
            invoice_id: invoice.invoiceId
          })),
        bank_charges: payment.bankCharges,
        account_id: payment.accountId,
        account_name: payment.accountName,
        payment_id: payment.paymentId,
        unused_amount: payment.unusedAmount,
        reference: payment.referenceNumber,
        date: payment.date
      });
    }
  }
};

export = TheService;
