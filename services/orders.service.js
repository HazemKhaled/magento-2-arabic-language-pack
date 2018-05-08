module.exports = {
  name: 'order',

  /**
   * Service settings
   */
  settings: {},

  /**
   * Service metadata
   */
  metadata: {},

  /**
   * Service dependencies
   */
  // dependencies: [],

  /**
   * Actions
   */
  actions: {
    /**
     * Welcome a username
     *
     * @param {String} name - User name
     */
    create: {
      params: {
        id: { type: 'string' },
        status: { type: 'string' },
        items: { type: 'array', items: 'object' },
        billing: {
          type: 'object',
          props: {
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            company: { type: 'string' },
            city: { type: 'string' },
            address_1: { type: 'string' },
            address_2: { type: 'string' },
            phone: { type: 'string' },
            postcode: { type: 'string' },
            state: { type: 'string' },
            country: { type: 'string' },
            email: { type: 'email' },
          }
        },
        shipping: {
          type: 'object',
          props: {
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            company: { type: 'string', optional: true },
            city: { type: 'string' },
            address_1: { type: 'string' },
            address_2: { type: 'string' },
            phone: { type: 'string' },
            postcode: { type: 'string' },
            state: { type: 'string' },
            country: { type: 'string' },
            email: { type: 'email' },
          }
        },
        invoice_url: { type: 'string' },
      },
      async handler(ctx) {
        const KlayerAPI = require('../libs/klayer');
        const api = new KlayerAPI();
        const created = api.createOrder(ctx.params, ctx.meta.user);
        return created;
      }
    }
  },

  /**
   * Events
   */
  events: {},

  /**
   * Methods
   */
  methods: {},

  /**
   * Service created lifecycle event handler
   */
  created() {},

  /**
   * Service started lifecycle event handler
   */
  started() {},

  /**
   * Service stopped lifecycle event handler
   */
  stopped() {}
};
