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
          'DELETE orders/:id': 'orders.delete'
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
