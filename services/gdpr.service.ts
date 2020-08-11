import {Errors as MoleculerErrors, ServiceSchema } from 'moleculer';
import { Mail } from '../utilities/mixins/mail.mixin';
import { GDPROpenapi } from '../utilities/mixins/openapi';
import { GDPRValidation } from '../utilities/mixins/validation';

const { MoleculerError } = MoleculerErrors;

const Service: ServiceSchema = {
  name: 'gdpr',
  mixins: [Mail, GDPRValidation, GDPROpenapi],
  actions: {
    customerRedact: {
      auth: 'Bearer',
      params: {
        customer: {
          type: 'object',
          props: {
            email: { type: 'email' },
          },
        },
      },
      async handler(ctx) {
        const { customer: { email } } = ctx.params;
        return this.sendRequest({
          subject: 'GDPR Customer Redact',
          text: `This customer with the storeId: ${ctx.meta.storeId} & customer email is ${email} has sent customer redact request.`,
        });
      },
    },
    storeRedact: {
      auth: 'Bearer',
      handler(ctx) {
        return this.sendRequest({
          subject: 'GDPR Customer Redact',
          text: `This customer with the storeId: ${ctx.meta.storeId} has sent store redact request.`,
        });
      },
    },
    customerDataRequest: {
      auth: 'Bearer',
      params: {
        customer: {
          type: 'object',
          props: {
            email: { type: 'email' },
          },
        },
      },
      handler(ctx) {
        const { customer: { email } } = ctx.params;
        return this.sendRequest({
          subject: 'GDPR Customer Data Request',
          text: `This customer with the storeId: ${ctx.meta.storeId} & customer email is ${email} has sent customer data request.`,
        });
      },
    },
  },
  methods: {
    sendRequest({ subject, text }) {
      return this.sendMail({
        to: process.env.SUPPORT_MAIL,
        subject,
        text,
      }).then(() => ({message: 'Your request succeed & it will be processed with in 14 working days.'})).catch(() => {
        const err = new MoleculerError('Request failed, please try again later', 500);
        err.name = 'GDPR_Service';
        throw err;
      });
    },
  },
};

export = Service;
