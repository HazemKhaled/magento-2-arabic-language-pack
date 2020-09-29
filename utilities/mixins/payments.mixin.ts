import fs from 'fs';

import { ServiceSchema } from 'moleculer';

export const CheckoutPage: ServiceSchema = {
  name: 'renderCheckoutPage',
  methods: {
    renderCheckoutPage(): string {
      return fs.readFileSync('./public/checkout.html', 'utf-8');
    },
  },
};
