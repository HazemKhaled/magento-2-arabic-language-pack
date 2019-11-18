import { Context, ServiceSchema } from 'moleculer';
import ApiGateway from 'moleculer-web';
import { Log } from '../utilities/types';

// tslint:disable-next-line:no-var-requires
const OpenApiMixin = require('../mixins/openapi.mixin');
const { UnAuthorizedError, ERR_NO_TOKEN, ERR_INVALID_TOKEN } = ApiGateway.Errors;

const TheService: ServiceSchema = {
  name: 'api',
  mixins: [ApiGateway, OpenApiMixin()],
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
          'PUT stores/:id/sync': 'stores.sync',
          'GET admin/stores': 'stores.storesList',

          // All Products
          'GET products': 'products-list.list',
          'GET products/:sku': 'products-list.get',
          'GET attributes': 'products.getAttributes',

          // Categories
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
          'POST invoices': 'invoices.create',
          'POST invoices/:id/credits': 'invoices.applyCredits',

          // Payments
          'POST payments/:id': 'payments.add',
          'GET payments': 'payments.get',

          // Membership
          'POST membership': 'membership.create',
          'GET membership': 'membership.list',
          'GET membership/:id': 'membership.get',
          'PUT membership/:id': 'membership.update',

          // Coupons
          'POST coupons': 'coupons.create',
          'GET coupons': 'coupons.list',
          'GET coupons/:id': 'coupons.get',
          'PUT coupons/:id': 'coupons.update',

          // Subscription
          'POST subscription': 'subscription.create',
          'GET subscription': 'subscription.list',
          'PUT subscription/:id': 'subscription.updateSubscription'
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
        },
        async onError(
          req: any,
          res: any,
          err: { message: string; code: number; name: string; type: string; data: any[] }
        ) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.writeHead(err.code || 500);
          if (err.code === 422 || err.code === 401 || err.name === 'NotFoundError') {
            res.end(
              JSON.stringify({
                name: err.name,
                message: err.message,
                code: err.code,
                type: err.type,
                data: err.data
              })
            );
          }
          if (err.code === 500 || !err.code) {
            const log = await this.sendLogs({
              topic: `${req.$action.service.name}`,
              topicId: `${req.$action.name}`,
              message: `Something went wrong fetching the data`,
              storeId: 'Unknown',
              logLevel: 'error',
              code: 500,
              payload: { error: err.toString(), params: req.$params }
            });
            res.end(
              JSON.stringify({
                errors: [
                  {
                    message: `Something went wrong for more details Please check the log under ID: ${
                      log.id
                    }`
                  }
                ]
              })
            );
          }
          res.end(JSON.stringify({ errors: [{ message: err.message }] }));
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
    },
    /**
     * Log order errors
     *
     * @param {Log} log
     * @returns {ServiceSchema}
     */
    sendLogs(log: Log): ServiceSchema {
      return this.broker.call('logs.add', log);
    }
  }
};

export = TheService;
