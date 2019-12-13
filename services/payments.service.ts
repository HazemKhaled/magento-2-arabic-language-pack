import { Context, ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';
import { PaymentsOpenapi } from '../utilities/mixins/openapi';
import { Payment, PaymentInvoice } from '../utilities/types';

const TheService: ServiceSchema = {
  name: 'payments',
  mixins: [PaymentsOpenapi],
  settings: {
    AUTH: Buffer.from(`${process.env.BASIC_USER}:${process.env.BASIC_PASS}`).toString('base64'),
  },
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
              invoice_id: { type: 'string' },
            },
          },
          optional: true,
        },
        account_id: { type: 'string' },
        bank_charges: { type: 'number', optional: true, convert: true },
        reference: [
          { type: 'string', optional: true },
          { type: 'number', integer: true, optional: true },
        ],
      },
      async handler(ctx: Context) {
        const instance = await ctx.call('stores.findInstance', {
          id: ctx.params.id,
        });
        if (instance.internal_data && instance.internal_data.omsId) {
          return fetch(`${process.env.OMS_BASEURL}/payments/${instance.internal_data.omsId}`, {
            method: 'post',
            headers: {
              Authorization: `Basic ${this.settings.AUTH}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              paymentMode: ctx.params.payment_mode,
              amount: ctx.params.amount,
              invoices: ctx.params.invoices
                ? ctx.params.invoices.map((invoice: { [key: string]: string }) => ({
                  invoiceId: invoice.invoice_id,
                  amountApplied: invoice.amount_applied,
                }))
                : undefined,
              accountId: ctx.params.account_id,
              bankCharges: ctx.params.bank_charges,
              referenceNumber: String(ctx.params.reference),
            }),
          })
            .then(async res => {
              const response = await res.json();
              if (!res.ok) {
                response.status = res.status;
                response.statusText = res.statusText;
                throw response;
              }
              // Store balance
              this.broker.cacher.clean(`stores.me:${instance.consumer_key}**`);
              this.broker.cacher.clean(`stores.get:${instance.url}**`);
              this.broker.cacher.clean(`payments.get:${instance.consumer_key}**`);
              this.broker.cacher.clean(`invoices.get:${instance.consumer_key}**`);
              return this.sanitizePayment(response.payment);
            })
            .catch(err => {
              ctx.meta.$statusCode = err.status || (err.error && err.error.statusCode) || 500;
              ctx.meta.$statusMessage =
                err.statusText || (err.error && err.error.name) || 'Internal Error';
              return {
                errors: [
                  {
                    message: err.error ? err.error.message : 'Internal Server Error',
                  },
                ],
              };
            });
        }
        ctx.meta.$statusCode = 404;
        ctx.meta.$statusMessage = 'Not Found';
        return {
          errors: [
            {
              message: 'No Record Found For This Store!',
            },
          ],
        };
      },
    },
    get: {
      auth: 'Bearer',
      cache: {
        keys: ['#user', 'page', 'limit', 'reference_number', 'payment_mode'],
        ttl: 60 * 60,
      },
      params: {
        page: { type: 'number', integer: true, optional: true, convert: true },
        limit: { type: 'number', integer: true, optional: true, convert: true },
        reference_number: { type: 'string', optional: true },
        payment_mode: { type: 'string', optional: true },
      },
      async handler(ctx: Context) {
        const instance = await ctx.call('stores.findInstance', {
          consumerKey: ctx.meta.user,
        });
        const url = new URL(`${process.env.OMS_BASEURL}/payments/${instance.internal_data.omsId}`);
        const keys: { [key: string]: string } = {
          page: 'page',
          limit: 'perPage',
          reference_number: 'reference_number',
          payment_mode: 'payment_mode',
        };
        Object.keys(ctx.params).forEach(key => {
          if (ctx.params[key]) url.searchParams.append(keys[key], ctx.params[key]);
        });
        if (instance.internal_data && instance.internal_data.omsId) {
          return fetch(url.href, {
            method: 'get',
            headers: {
              Authorization: `Basic ${this.settings.AUTH}`,
            },
          })
            .then(async res => {
              const response = await res.json();
              if (!res.ok) {
                response.status = res.status;
                response.statusText = res.statusText;
                throw response;
              }
              return { payments: response.payments.map(this.sanitizePayment) };
            })
            .catch(err => {
              this.logger.info(err);
              ctx.meta.$statusCode = err.status || (err.error && err.error.statusCode) || 500;
              ctx.meta.$statusMessage =
                err.statusText || (err.error && err.error.name) || 'Internal Error';
              return {
                errors: [
                  {
                    message: err.error ? err.error.message : 'Internal Server Error',
                  },
                ],
              };
            });
        }
        ctx.meta.$statusCode = 404;
        ctx.meta.$statusMessage = 'Not Found';
        return {
          errors: [
            {
              message: 'No Record Found For This Store!',
            },
          ],
        };
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
