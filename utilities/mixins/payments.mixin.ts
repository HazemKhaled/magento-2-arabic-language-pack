import fs from 'fs';

import { ServiceSchema } from 'moleculer';

export const CheckoutPage: ServiceSchema = {
  name: 'renderCheckoutPage',
  methods: {
    renderCheckoutPage(): string {
      const template = fs.readFileSync('./public/index.html', 'utf-8');

      return template;
    },
  },
};
