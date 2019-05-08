const fetch = require('node-fetch');

module.exports = {
  name: 'currencies',
  settings: {
    AUTH: Buffer.from(`${process.env.BASIC_USER}:${process.env.BASIC_PASS}`).toString('base64')
  },
  actions: {
    getCurrency: {
      params: {
        currencyCode: { type: 'string', min: 3, max: 3 }
      },
      handler(ctx) {
        return fetch(`${process.env.OMS_URL}/currencies/${ctx.params.currency}`, {
          method: 'get',
          headers: {
            Authorization: `Basic ${this.settings.AUTH}`
          }
        }).then(res => res.json());
      }
    },
    getCurrencies: {
      handler() {
        return fetch(`${process.env.OMS_URL}/currencies`, {
          method: 'get',
          headers: {
            Authorization: `Basic ${this.settings.AUTH}`
          }
        }).then(res => res.json());
      }
    }
  }
};
