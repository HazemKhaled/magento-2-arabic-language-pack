const ApiGateway = require('moleculer-web');

const { UnAuthorizedError } = ApiGateway.Errors;

module.exports = {
  name: 'api',
  mixins: [ApiGateway],

  settings: {
    port: process.env.PORT || 3000,

    routes: [
      {
        path: '/api',

        authorization: true,

        aliases: {
          // Login
          'POST token': 'users.login',

          // Product
          'GET catalog/products': 'products.list',
          'GET catalog/products/count': 'products.count',
          'GET catalog/products/:sku': 'products.get',
          'DELETE catalog/products/:sku': 'products.delete',
          'GET catalog/categories': 'categories.list',
          // 'GET catalog/list': 'products-list.searchByFilters',
          'POST catalog/add': 'products.import',
          'PUT catalog/update/:sku': 'products.update',
          // Order
          'POST orders': 'orders.create',
          'GET orders/:order_id': 'orders.get',
          'GET orders': 'orders.list',
          'PUT orders/:id': 'orders.update'
        },

        // Disable to call not-mapped actions
        mappingPolicy: 'restrict',

        // Set CORS headers
        cors: false,

        // Parse body content
        bodyParsers: {
          json: {
            strict: false
          },
          urlencoded: {
            extended: false
          }
        }
      }
    ],

    assets: {
      folder: './public'
    }
  },

  methods: {
    /**
     * Authorize the request
     *
     * @param {Context} ctx
     * @param {Object} route
     * @param {IncomingRequest} req
     * @returns {Promise}
     */
    authorize(ctx, route, req) {
      let reqToken;
      if (req.headers.authorization) {
        const [type] = req.headers.authorization.split(' ');
        if (type === 'Token' || type === 'Bearer') {
          [, reqToken] = req.headers.authorization.split(' ');
        }
      }

      return this.Promise.resolve(reqToken)
        .then(token => {
          if (token) {
            // Verify JWT token
            return (
              ctx
                .call('users.resolveToken', { token })
                .then(user => {
                  if (user) {
                    this.logger.info('Authenticated via JWT: ', user.id);
                    // Reduce user fields (it will be transferred to other nodes)
                    ctx.meta.user = user.id;
                    ctx.meta.token = token;
                  }
                  return user;
                })
                // Ignored because we continue processing if user is not exist
                .catch(() => null)
            );
          }
        })
        .then(user => {
          if (req.$endpoint.action.auth === 'required' && !user) {
            return this.Promise.reject(new UnAuthorizedError());
          }
        });
    }
  }
};
