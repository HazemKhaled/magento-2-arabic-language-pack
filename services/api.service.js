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
          'POST catalog/products': 'products.import',
          'GET catalog/products/count': 'products.total',
          'GET catalog/products/:sku': 'products.getInstanceProduct',
          'DELETE catalog/products/:sku': 'products.deleteInstanceProduct',
          'PUT catalog/products/:sku': 'products.instanceUpdate',
          'PATCH catalog/products': 'products.bulkProductInstance',

          // Old routes, should be deprecated
          'PUT catalog/update/:sku': 'products.instanceUpdate',
          'POST catalog/add': 'products.import',

          'GET catalog/categories': 'categories.list',

          'GET catalog/list': 'products-list.searchByFilters',
          // Order
          'POST orders': 'orders.create',
          'GET orders/:order_id': 'orders.get',
          'GET orders': 'orders.list',
          'PUT orders/:id': 'orders.update',
          'DELETE orders/:id': 'orders.delete',

          // Stores
          'GET stores/me': 'stores.me',
          'GET stores/:id': 'stores.get',
          'GET stores': 'stores.list',
          'POST stores': 'stores.create',
          'PUT stores/:id': 'stores.update'
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
      // Pass if no auth required
      if (!req.$endpoint.action.auth) {
        return;
      }

      const [type, reqToken] = req.headers.authorization.split(' ');
      if (!type || !reqToken) {
        return this.Promise.reject(new UnAuthorizedError());
      }

      return this.Promise.resolve(reqToken)
        .then(token => {
          // Verify JWT token
          if (type === 'Bearer') {
            return (
              ctx
                .call('users.resolveBearerToken', { token })
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

          // Verify Base64 Basic auth
          if (type === 'Basic') {
            return (
              ctx
                .call('users.resolveBasicToken', { token })
                .then(user => {
                  if (user) {
                    this.logger.info('Authenticated via Basic');

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
          if (!user) {
            return this.Promise.reject(new UnAuthorizedError());
          }
        });
    }
  }
};
