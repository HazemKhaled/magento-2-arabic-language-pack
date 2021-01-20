import { Context, ServiceSchema, GenericObject } from 'moleculer';
import ApiGateway from 'moleculer-web';
import compression from 'compression';
import { MoleculerRequest } from 'moleculer-express';
import fetch from 'node-fetch';

import { Log, Store, MetaParams, IncomingRequest } from '../utilities/types';
import { OpenApiMixin } from '../utilities/mixins/openapi.mixin';
import { webpackMiddlewares } from '../utilities/middleware';
import { authorizeHmac } from '../utilities/lib';

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

    rateLimit: {
      // How long to keep record of requests in memory (in milliseconds).
      // Defaults to 60000 (1 min)
      window: Number(process.env.RATE_LIMIT_TIME) || 60 * 1000,

      // Max number of requests during window. Defaults to 30
      limit: Number(process.env.RATE_LIMIT) || 30,

      // Set rate limit headers to response. Defaults to false
      headers: Boolean(process.env.RATE_LIMIT_HEADER) || true,

      // Function used to generate keys. Defaults to:
      key(req: IncomingRequest): string | number {
        const [type, reqToken] = req.headers.authorization
          ? req.headers.authorization?.split(' ')
          : '';
        return type?.toLowerCase() === 'bearer' ? reqToken : Date.now();
      },
    },

    routes: [
      {
        path: '/api',

        authorization: true,
        whitelist: ['**'],
        autoAliases: true,

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

          // Categories
          'GET catalog/categories': 'categories.list',

          // Currencies
          'GET currencies/:currencyCode': 'currencies.getCurrency',
          'GET currencies': 'currencies.getCurrencies',

          // Invoices
          'GET invoices': 'invoices.get',
          'POST invoices': 'invoices.create',
          'POST invoices/:id/credits': 'invoices.applyCredits',
          'GET invoices/:storeId/external/:id': 'invoices.renderInvoice',

          // Payments
          'POST payments/:id': 'payments.add',
          'GET payments': 'payments.get',

          // GDPR
          'POST customer/redact': 'gdpr.customerRedact',
          'POST store/redact': 'gdpr.storeRedact',
          'POST customer/data_request': 'gdpr.customerDataRequest',

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
          req: IncomingRequest,
          res: GenericObject,
          err: {
            message: string;
            code: number;
            name: string;
            type: string;
            data: unknown[];
          }
        ): Promise<void> {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.writeHead(err.code || 500);
          if (
            err.code === 422 ||
            err.code === 401 ||
            err.name === 'NotFoundError'
          ) {
            return res.end(
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
              topic: `${String(req.$params?.topic)}`
                ? `${String(req.$params?.topic)}`
                : `${String(req.$action.service?.name)}`,
              topicId: `${req.$action.name}`,
              message: 'Something went wrong fetching the data',
              storeId: req.$meta?.storeId
                ? `${String(req.$meta.storeId)}`
                : 'Unknown',
              logLevel: 'error',
              code: 500,
              payload: { error: err.toString(), params: req.$params },
            }).catch((err: unknown) => this.broker.logger.error(err));

            if (log) {
              return res.end(
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

          return res.end(
            JSON.stringify({
              errors: [{ message: err.message || 'Internal Server Error!' }],
            })
          );
        },
      },
      {
        path: '/',

        authorization: true,
        cors: {
          origin: '*',
          credentials: false,
          maxAge: 3600,
        },
        // Route error handler
        async onError(req: any, res: any, err: any) {
          const output = await req.$ctx.call('paymentGateway.error', {
            error: {
              code: err.code,
              message: err.message,
              data: err.data,
            },
          });

          res.setHeader('Content-Type', 'text/html');
          res.end(output);
        },
        use: [
          compression(),
          // Webpack middleware
          ...webpackMiddlewares(),
          ApiGateway.serveStatic('public'),
        ],
        aliases: {
          'GET checkout': 'paymentGateway.get',
          'GET cards/list': 'paymentGateway.cardsList',
        },
      },
    ],
  },

  actions: {
    listAliases: {
      visibility: 'public',
    },
  },

  methods: {
    /**
     * Authorize the request
     *
     * @param {Context<void, MetaParams>} ctx
     * @param {unknown} route
     * @param {IncomingRequest} req
     * @returns {(Promise<Store | boolean>)}
     */
    authorize(
      ctx: Context<void, MetaParams>,
      route: unknown,
      req: IncomingRequest & MoleculerRequest
    ): Promise<Store | boolean> {
      const { $endpoint, headers } = req as GenericObject;
      // Pass if no auth required
      if (!$endpoint.action.auth) {
        return this.Promise.resolve();
      }

      if ($endpoint.action.auth.includes('Hmac')) {
        return authorizeHmac(ctx, req);
      }

      // if no authorization in the header
      if (!headers.authorization) {
        throw new UnAuthorizedError(ERR_NO_TOKEN, headers);
      }

      // If token or token type are missing, throw error
      const [type, reqToken] = req.headers.authorization.split(' ');
      if (!type || !reqToken || !req.$action.auth.includes(type)) {
        throw new UnAuthorizedError(ERR_NO_TOKEN, req.headers.authorization);
      }

      return this.Promise.resolve(reqToken)
        .then((token: string) => {
          // Verify JWT token
          if (type === 'Bearer') {
            return ctx
              .call<Store, { token: string }>('stores.resolveBearerToken', {
                token,
              })
              .then(store => {
                if (!store) {
                  return this.Promise.reject(
                    new UnAuthorizedError(
                      ERR_INVALID_TOKEN,
                      headers.authorization
                    )
                  );
                }

                this.logger.info('Authenticated via JWT: ', store.consumer_key);
                // Reduce user fields (it will be transferred to other nodes)
                ctx.meta.user = store.consumer_key;
                ctx.meta.token = token;
                ctx.meta.storeId = store.url;
                ctx.meta.store = store;

                return store;
              });
          }

          // Verify Base64 Basic auth
          if (type === 'Basic') {
            return this.resolveBasicToken(token).then((user: unknown) => {
              if (user) {
                ctx.meta.token = token;
              }
              return user;
            });
          }
        })
        .then((user: unknown) => {
          if (!user) {
            throw new UnAuthorizedError(
              ERR_INVALID_TOKEN,
              req.headers.authorization
            );
          }

          return user;
        });
    },

    /**
     * Get user by JWT token (for API GW authentication)
     *
     * @param {string} token
     * @returns {(Promise<GenericObject | boolean>)}
     */
    resolveBasicToken(token: string): Promise<GenericObject | boolean> {
      return fetch(`${process.env.AUTH_BASEURL}/login`, {
        headers: {
          Authorization: `Basic ${token}`,
        },
      }).then(res => {
        if (res.ok) {
          return res.json();
        }

        return false;
      });
    },
    /**
     * Log order errors
     *
     * @param {Log} log
     * @returns {Log} Created log
     */
    sendLogs(log: Log): Log {
      return this.broker.call('logs.add', log);
    },
  },
};

export = TheService;
