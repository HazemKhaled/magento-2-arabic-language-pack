import { Context, ServiceSchema } from 'moleculer';
import ApiGateway from 'moleculer-web';

const { UnAuthorizedError, ERR_NO_TOKEN, ERR_INVALID_TOKEN } = ApiGateway.Errors;

const TheService: ServiceSchema = {
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
          'PUT catalog/products/:sku': 'products.instanceUpdate',
          'DELETE catalog/products/:sku': 'products.deleteInstanceProduct',
          'PATCH catalog/products': 'products.bulkProductInstance',

          // Old routes, should be deprecated
          'PUT catalog/update/:sku': 'products.instanceUpdate',
          'POST catalog/add': 'products.import',

          // Orders
          'GET orders': 'orders.list',
          'POST orders': 'orders.createOrder',
          'GET orders/:order_id': 'orders.getOrder',
          'PUT orders/:id': 'orders.updateOrder',
          'DELETE orders/:id': 'orders.deleteOrder',

          // Stores
          'GET stores/me': 'stores.me',
          'GET stores': 'stores.list',
          'POST stores': 'stores.create',
          'GET stores/:id': 'stores.get',
          'PUT stores/:id': 'stores.update',
          'PUT stores/:storeId/sync': 'stores.sync',

          // All Products
          'GET products': 'products-list.list',
          'GET products/:sku': 'products-list.get',
          'GET attributes': 'products.getAttributes',

          'GET catalog/categories': 'categories.list',

          // Currencies
          'GET currencies/:currencyCode': 'currencies.getCurrency',
          'GET currencies': 'currencies.getCurrencies',

          // Shipment
          'POST shipment': 'shipment.insertShipment',
          'PUT shipment/:id': 'shipment.updateShipment',
          'GET shipment': 'shipment.getShipments',
          'GET shipment/rules': 'shipment.ruleByCountry',
          'GET shipment/couriers': 'shipment.getCouriers',
          'GET shipment/:id': 'shipment.getShipments',

          // Logs
          'POST logs': 'logs.add',
          'GET logs': 'logs.getLogs',

          // Invoices
          'GET invoices': 'invoices.get',

          // Payments
          'POST payments/:storeId': 'payments.add',
          'GET payments': 'payments.get'
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
    authorize(ctx: Context, route: any, req: any) {
      // Pass if no auth required
      if (!req.$endpoint.action.auth) {
        return;
      }

      // if no authorization in the header
      if (!req.headers.authorization) {
        throw new UnAuthorizedError(ERR_NO_TOKEN, req.headers);
      }

      // If token or token type are missing, throw error
      const [type, reqToken] = req.headers.authorization.split(' ');
      if (!type || !reqToken) {
        return this.Promise.reject(new UnAuthorizedError(ERR_NO_TOKEN, req.headers.authorization));
      }

      return this.Promise.resolve(reqToken)
        .then((token: string) => {
          // Verify JWT token
          if (type === 'Bearer') {
            if (req.$action.auth !== 'Bearer') {
              return this.Promise.reject(
                new UnAuthorizedError(ERR_NO_TOKEN, req.headers.authorization)
              );
            }
            return ctx.call('users.resolveBearerToken', { token }).then((user: { id: string }) => {
              if (!user) {
                return this.Promise.reject(
                  new UnAuthorizedError(ERR_INVALID_TOKEN, req.headers.authorization)
                );
              }
              if (user) {
                this.logger.info('Authenticated via JWT: ', user.id);
                // Reduce user fields (it will be transferred to other nodes)
                ctx.meta.user = user.id;
                ctx.meta.token = token;
              }
              return user;
            });
          }

          // Verify Base64 Basic auth
          if (type === 'Basic') {
            if (req.$action.auth !== 'Basic') {
              return this.Promise.reject(
                new UnAuthorizedError(ERR_NO_TOKEN, req.headers.authorization)
              );
            }
            return ctx.call('users.resolveBasicToken', { token }).then((user: any) => {
              if (user) {
                this.logger.info('Authenticated via Basic');

                ctx.meta.token = token;
              }
              return user;
            });
          }
        })
        .then((user: any) => {
          if (!user) {
            return this.Promise.reject(
              new UnAuthorizedError(ERR_INVALID_TOKEN, req.headers.authorization)
            );
          }
        });
    }
  }
};

export = TheService;
