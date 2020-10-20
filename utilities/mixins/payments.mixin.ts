import { ServiceSchema } from 'moleculer';

export const CheckoutPage: ServiceSchema = {
  name: 'renderCheckoutPage',
  methods: {
    renderCheckoutPage(initialState: unknown): string {
      const __state = JSON.stringify(initialState);

      return `<!DOCTYPE html>
      <html lang="en">
      
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        <title>Knawat</title>
      
        <link href="/style.css" rel="stylesheet"></head>
      </head>
      
      <body>
        <div id="app">
          <div class="spinner"></div>
        </div>
    
        <script>window.__INITIAL_STATE__=${__state}</script>
        <script src="/app.js"></script>
      </body>
      
      </html>`;
    },
  },
};
