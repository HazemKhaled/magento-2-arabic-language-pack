import { Context, ServiceSchema } from 'moleculer';
import ApiGateway from 'moleculer-web';
import compression from 'compression';

import { Log, Store } from '../utilities/types';
import { OpenApiMixin } from '../utilities/mixins/openapi.mixin';
import { hmacMiddleware, webpackMiddlewares } from '../utilities/middleware';

const {
  UnAuthorizedError,
  ERR_NO_TOKEN,
  ERR_INVALID_TOKEN,
} = ApiGateway.Errors;

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
          'GET catalog/products': 'products-instances.list',
          'POST catalog/products': 'products-instances.import',
          'GET catalog/products/count': 'products-instances.total',
          'GET catalog/products/:sku': 'products-instances.getInstanceProduct',
          'PUT catalog/products/:sku': 'products-instances.instanceUpdate',
          'DELETE catalog/products/:sku':
            'products-instances.deleteInstanceProduct',
          'PATCH catalog/products': 'products-instances.bulkProductInstance',
          'POST catalog/products/search': 'products-instances.pSearch',

          // Old routes, should be deprecated
          'PUT catalog/update/:sku': 'products-instances.instanceUpdate',
          'POST catalog/add': 'products-instances.import',

          // Orders
          'GET orders': 'orders.list',
          'POST orders': 'orders.createOrder',
          'GET orders/:order_id': 'orders.getOrder',
          'GET orders/:order_id/warnings': 'orders.getOrderWarnings',
          'PUT orders/:id': 'orders.updateOrder',
          'PUT orders/pay/:id': 'orders.payOrder',
          'DELETE orders/:id': 'orders.deleteOrder',

          // Stores
          'GET stores/me': 'stores.me',
          'PUT stores/me': 'stores.meUpdate',
          'GET stores': 'stores.list',
          'POST stores': 'stores.create',
          'GET stores/:id': 'stores.sGet',
          'PUT stores/:id': 'stores.update',
          'PUT stores/:id/sync': 'stores.sync',
          'GET admin/stores': 'stores.storesList',

          // All Products
          'GET products': 'products.list',
          'GET products/variation': 'products.getProductsByVariationSku',
          'GET products/:sku': 'products.getBySku',

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

          // Cards
          'POST cards': 'cards.create',
          'PUT cards/:id': 'cards.update',
          'GET cards/:id': 'cards.get',
          'DELETE cards/:id': 'cards.delete',

          // paymentGateway
          'POST paymentGateway/:type/transaction': 'paymentGateway.transaction',

          // Payments mp
          'POST payments/:id': 'payments.add',
          'GET payments': 'payments.get',

          // Membership
          'POST membership': 'membership.create',
          'GET membership': 'membership.list',
          'GET membership/:id': 'membership.mGet',
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
          'DELETE subscription/:id': 'subscription.cancel',

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
          'GET crm/:module': 'crm.findRecords',
          'POST crm/:module': 'crm.createRecord',
          'PUT crm/:module/:id': 'crm.updateRecord',
          'POST crm/:module/:id/tags/add': 'crm.addTagsToRecord',
          'DELETE crm/:module/:id/tags/remove': 'crm.removeTagsFromRecord',

          // Webhook
          'POST webhooks': 'registry.create',
          'GET webhooks': 'registry.list',
          'DELETE webhooks/:id': 'registry.remove',

          'POST webhooks/:event': 'publisher.publish',

          // Async API
          'async/(.*)': 'tasks.handle',
        },

        // Disable to call not-mapped actions
        mappingPolicy: 'restrict',

        // Set CORS headers
        cors:
          process.env.NODE_ENV === 'production'
            ? false
            : {
                // Configures the Access-Control-Allow-Origin CORS header.
                origin: ['http://localhost*'],
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
          err: {
            message: string;
            code: number;
            name: string;
            type: string;
            data: any[];
          }
        ): Promise<void> {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.writeHead(err.code || 500);
          if (
            err.code === 422 ||
            err.code === 401 ||
            err.name === 'NotFoundError'
          ) {
            res.end(
              JSON.stringify({
                name: err.name,
                message: err.message,
                code: err.code,
                type: err.type,
                data: err.data,
              })
            );
          }
          if (err.code === 500 || !err.code) {
            const log = await this.sendLogs({
              topic: req.$action.service?.name
                ? `${String(req.$action.service?.name)}`
                : `${String(req.$params?.topic)}`,
              topicId: `${req.$action.name}`,
              message: 'Something went wrong fetching the data',
              storeId: req.$params?.storeId
                ? `${String(req.$params.storeId)}`
                : 'Unknown',
              logLevel: 'error',
              code: 500,
              payload: { error: err.toString(), params: req.$params },
            }).catch((err: unknown) => this.broker.logger.error(err));

            if (log) {
              res.end(
                JSON.stringify({
                  errors: [
                    {
                      message: `Something went wrong for more details Please check the log under ID: ${log.id}`,
                    },
                  ],
                })
              );
            }
          }
          res.end(
            JSON.stringify({
              errors: [{ message: err.message || 'Internal Server Error!' }],
            })
          );
        },
      },
      {
        path: '/',

        authorization: false,
        use: [
          compression(),
          // Webpack middleware
          ...webpackMiddlewares(),
          ApiGateway.serveStatic('public'),
        ],
        aliases: {
          'GET checkout': [hmacMiddleware(), 'payments.checkout'],
        },
      },
    ],
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
    authorize(ctx: Context, route: any, req: any): Promise<any> {
      // Pass if no auth required
      if (!req.$endpoint.action.auth) {
        return this.Promise.resolve();
      }

      // if no authorization in the header
      if (!req.headers.authorization) {
        throw new UnAuthorizedError(ERR_NO_TOKEN, req.headers);
      }

      // If token or token type are missing, throw error
      const [type, reqToken] = req.headers.authorization.split(' ');
      if (!type || !reqToken || !req.$action.auth.includes(type)) {
        return this.Promise.reject(
          new UnAuthorizedError(ERR_NO_TOKEN, req.headers.authorization)
        );
      }

      return this.Promise.resolve(reqToken)
        .then((token: string) => {
          // Verify JWT token
          if (type === 'Bearer') {
            return ctx
              .call('stores.resolveBearerToken', { token })
              .then((user: Store) => {
                if (!user) {
                  return this.Promise.reject(
                    new UnAuthorizedError(
                      ERR_INVALID_TOKEN,
                      req.headers.authorization
                    )
                  );
                }
                if (user) {
                  this.logger.info(
                    'Authenticated via JWT: ',
                    user.consumer_key
                  );
                  // Reduce user fields (it will be transferred to other nodes)
                  ctx.meta.user = user.consumer_key;
                  ctx.meta.token = token;
                  ctx.meta.storeId = user.url;
                  ctx.meta.store = user;
                }
                return user;
              });
          }

          // Verify Base64 Basic auth
          if (type === 'Basic') {
            return ctx
              .call('stores.resolveBasicToken', { token })
              .then((user: any) => {
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
              new UnAuthorizedError(
                ERR_INVALID_TOKEN,
                req.headers.authorization
              )
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
