import { Context, ServiceSchema } from 'moleculer';
import ApiGateway from 'moleculer-web';
import { Log, Store } from '../utilities/types';

import { OpenApiMixin } from '../utilities/mixins/openapi.mixin';

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
          'POST token': 'stores.login',

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
          'GET stores/:id': 'stores.sGet',
          'PUT stores/:id': 'stores.update',
          'PUT stores/:id/sync': 'stores.sync',
          'GET admin/stores': 'stores.storesList',

          // All Products
          'GET products': 'products-list.list',
          'GET products/variation': 'products-list.getProductsByVariationSku',
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
          'GET invoice/:storeId/external/:id': 'invoices.renderInvoice',

          // paymentGateway
          'POST paymentGateway/:type/transaction': 'paymentGateway.transaction',
          'GET paymentGateway/callback': 'paymentGateway.callback',

          // Payments mp
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
          'GET subscription': 'subscription.sList',
          'PUT subscription/:id': 'subscription.updateSubscription',

          // Taxes
          'POST tax': 'taxes.tCreate',
          'PUT tax/:id': 'taxes.tUpdate',
          'GET tax/:id': 'taxes.tGet',
          'GET tax': 'taxes.tList',
          'DELETE tax/:id': 'taxes.tDelete',

          // GDPR
          'POST customer/redact': 'gdpr.customerRedact',
          'POST store/redact': 'gdpr.storeRedact',
          'POST customer/data_request': 'gdpr.customerDataRequest',

          // CRM
          'GET crm/:module/search': 'crm.findModuleRecords',
          'GET crm/:module/:id/tags/add': 'crm.addTagsToRecord',
        },

        // Disable to call not-mapped actions
        mappingPolicy: 'restrict',

        // Set CORS headers
        cors: process.env.NODE_ENV === 'production' ? false : {
          // Configures the Access-Control-Allow-Origin CORS header.
          origin: [
            'http://localhost*',
          ],
          // Configures the Access-Control-Allow-Methods CORS header.
          methods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTION'],
          // Configures the Access-Control-Allow-Headers CORS header.
          allowedHeaders: [
            '*',
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization',
          ],
          // Configures the Access-Control-Expose-Headers CORS header.
          exposedHeaders: [],
          // Configures the Access-Control-Allow-Credentials CORS header.
          credentials: true,
          // Configures the Access-Control-Max-Age CORS header.
          maxAge: 3600,
        },

        // Parse body content
        bodyParsers: {
          json: {
            strict: false,
          },
          urlencoded: {
            extended: false,
          },
        },
        async onError(
          req: any,
          res: any,
          err: { message: string; code: number; name: string; type: string; data: any[] },
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
                data: err.data,
              }),
            );
          }
          if (err.code === 500 || !err.code) {
            const log = await this.sendLogs({
              topic: `${req.$action.service.name}`,
              topicId: `${req.$action.name}`,
              message: 'Something went wrong fetching the data',
              storeId: 'Unknown',
              logLevel: 'error',
              code: 500,
              payload: { error: err.toString(), params: req.$params },
            });
            res.end(
              JSON.stringify({
                errors: [
                  {
                    message: `Something went wrong for more details Please check the log under ID: ${
                      log.id
                    }`,
                  },
                ],
              }),
            );
          }
          res.end(JSON.stringify({ errors: [{ message: err.message }] }));
        },
      },
    ],

    assets: {
      folder: './public',
    },
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
                new UnAuthorizedError(ERR_NO_TOKEN, req.headers.authorization),
              );
            }
            return ctx.call('stores.resolveBearerToken', { token }).then((user: Store) => {
              if (!user) {
                return this.Promise.reject(
                  new UnAuthorizedError(ERR_INVALID_TOKEN, req.headers.authorization),
                );
              }
              if (user) {
                this.logger.info('Authenticated via JWT: ', user.consumer_key);
                // Reduce user fields (it will be transferred to other nodes)
                ctx.meta.user = user.consumer_key;
                ctx.meta.token = token;
                ctx.meta.storeId = user.id;
              }
              return user;
            });
          }

          // Verify Base64 Basic auth
          if (type === 'Basic') {
            if (req.$action.auth !== 'Basic') {
              return this.Promise.reject(
                new UnAuthorizedError(ERR_NO_TOKEN, req.headers.authorization),
              );
            }
            return ctx.call('stores.resolveBasicToken', { token }).then((user: any) => {
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
              new UnAuthorizedError(ERR_INVALID_TOKEN, req.headers.authorization),
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
    },
  },
};

export = TheService;
