import { ServiceSchema } from 'moleculer';

import { createApp } from '../../client/app';

export const CheckoutPage: ServiceSchema = {
  name: 'renderCheckoutPage',
  methods: {
    renderCheckoutPage(): Promise<string> {
      const context = {
        title: 'Knawat | checkout',
        meta: `
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
        `,
      };
      const renderer = require('vue-server-renderer').createRenderer({
        template: require('fs').readFileSync(
          './client/index.template.html',
          'utf-8'
        ),
      });

      const { app } = createApp();
      return renderer.renderToString(app, context);
    },
  },
};
