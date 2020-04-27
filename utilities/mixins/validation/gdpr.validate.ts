import { ServiceSchema } from 'moleculer';

export const GDPRValidation: ServiceSchema = {
  name: 'gdpr',
  actions: {
    customerRedact: {
      params: {
        customer: {
          type: 'object',
          props: {
            email: { type: 'email' },
          },
        },
      },
    },
    customerDataRequest: {
      params: {
        customer: {
          type: 'object',
          props: {
            email: { type: 'email' },
          },
        },
      },
    },
  },
};
