import fs from 'fs';
import _ from 'lodash';

import { Action, Errors, ServiceSchema } from 'moleculer';

const { MoleculerServerError } = Errors;

import pkg from '../../package.json';

/**
 * OpenAPI mixin
 *
 * @export
 * @returns {ServiceSchema}
 */
export function OpenApiMixin(): ServiceSchema {
  const mixinOptions: { schema: any; routeOptions: { path: string } } = {
    routeOptions: {
      path: '/openapi',
    },
    schema: null,
  };

  let shouldUpdateSchema = true;
  let schema: any = null;

  return {
    name: 'openapi',
    events: {
      '$services.changed'() {
        this.invalidateOpenApiSchema();
      },
    },

    methods: {
      /**
       * Invalidate the generated OpenAPI schema
       */
      invalidateOpenApiSchema() {
        shouldUpdateSchema = true;
      },

      /**
       * Generate OpenAPI Schema
       */
      generateOpenAPISchema() {
        try {
          const res = _.defaultsDeep(mixinOptions.schema, {
            openapi: '3.0.1',

            // https://swagger.io/specification/#infoObject
            info: {
              title: `${pkg.name} API Documentation`,
              version: pkg.version,
              termsOfService: 'https://knawat.com/terms-and-conditions/',
              contact: {
                email: 'support@knawat.com',
                url: 'https://developer.knawat.com',
              },
              license: {
                name: `Knawat Copyright © - 2017 -  ${new Date().getFullYear()}`,
                url: 'https://knawat.com/terms-and-conditions/',
              },
              description: `Welcome to the Knawat MP documentation. Navigate through the documentation to learn more. If you encounter any problems when using our APIs, send us an email it@knawat.com;

## What is Knawat?

Knawat is a Drop-Shipping platform. We are bringing hundreds of thousands of products to let you list in your e-commerce store. We also do all operations behind the e-commerce, so once you receive an order, we will ship it to your customer with your invoice.

## What is Knawat MP API?

Knawat MP APIs mainly for e-commerce stores, allows you to aggregate products to your store, update stock and prices, and send us your orders.

## Support and Chat

We are happy to receive your questions. click here to [chat with us](https://gitter.im/Knawat/Lobby)`,
            },

            // https://swagger.io/specification/#serverObject
            servers: [
              {
                description: 'Sandbox Server',
                url: 'https://dev.mp.knawat.io/api',
              },
              {
                description: 'Production Server',
                url: 'https://mp.knawat.io/api',
              },
            ],

            // https://swagger.io/specification/#componentsObject
            components: {
              responses: {
                UnauthorizedErrorToken: {
                  description: 'Access token is missing or invalid, request new one',
                },
                UnauthorizedErrorBasic: {
                  description: 'Authentication information is missing or invalid',
                  headers: {
                    WWW_Authenticate: {
                      schema: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
              securitySchemes: {
                bearerAuth: {
                  type: 'http',
                  scheme: 'bearer',
                  bearerFormat: 'JWT',
                },
                basicAuth: {
                  description:
                    'Knawat provide <a href="#tag/Enterprise-Only">extra endpoints</a> for enterprise subscriptions, check <a href="https://knawat.com/plans">pricing here</a>.',
                  type: 'http',
                  scheme: 'basic',
                },
              },
              schemas: {
                Error: {
                  type: 'object',
                  required: ['message'],
                  properties: {
                    status: {
                      type: 'string',
                    },
                    message: {
                      type: 'string',
                    },
                  },
                  description: 'This general error structure is used throughout this API.',
                  example: {
                    message: 'SKU(s) out of stock.',
                  },
                },
              },
            },

            // https://swagger.io/specification/#pathsObject
            paths: {},

            // https://swagger.io/specification/#securityRequirementObject
            security: [],

            // https://swagger.io/specification/#tagObject
            tags: [
              {
                name: 'Authentication',
                description: 'text here',
              },
              {
                name: 'My Products',
                description:
                  `How products can come to your API?
![](https://www.dropbox.com/s/tb8708y269pccx0/ZApp%20-%20products.png?dl=1)`,
                externalDocs: {
                  description: 'Register and import some products',
                  url: 'https://app.knawat.com',
                },
              },
              {
                name: 'Orders',
              },
              {
                name: 'Invoices',
              },
              {
                name: 'Payments',
              },
              {
                name: 'Enterprise Only',
                description: 'Ask sales for enterprise subscriptions',
                externalDocs: {
                  url: 'https://knawat.com/pricing',
                },
              },
              {
                name: 'Stores',
              },
              {
                name: 'Products',
                description:
                  'This is how you can get all Knawat products to list it directly on your store, this endpoint for enterprise only customers only',
              },
              {
                name: 'Currencies',
              },
              {
                name: 'Shipment',
              },
              {
                name: 'Subscription',
              },
              {
                name: 'Coupon',
              },
              {
                name: 'Membership',
              },
              {
                name: 'Taxes',
              },
            ],

            // https://swagger.io/specification/#externalDocumentationObject
            externalDocs: [],
          });

          const services = this.broker.registry.getServiceList({
            withActions: true,
          });
          services.forEach((service: any) => {
            // --- COMPILE SERVICE-LEVEL DEFINITIONS ---
            if (service.settings.openapi) {
              _.merge(res, service.settings.openapi);
            }

            // --- COMPILE ACTION-LEVEL DEFINITIONS ---
            _.forIn(service.actions, (action: Action) => {
              if (action.openapi) {
                if (_.isObject(action.openapi)) {
                  const def: { $path?: string } = _.cloneDeep(action.openapi);
                  let method: any;
                  let routePath: any;
                  if (def.$path) {
                    const p = def.$path.split(' ');
                    method = p[0].toLowerCase();
                    routePath = p[1];
                    delete def.$path;
                  }

                  _.set(res.paths, [routePath, method], def);
                }
              }
            });
          });

          return res;
        } catch (err) {
          throw new MoleculerServerError(
            'Unable to compile OpenAPI schema',
            500,
            'UNABLE_COMPILE_OPENAPI_SCHEMA',
            { err },
          );
        }
      },
    },

    created() {
      const route = _.defaultsDeep(mixinOptions.routeOptions, {
        path: '/openapi',
        // Set CORS headers
        cors: {
          // Configures the Access-Control-Allow-Origin CORS header.
          origin: '*',
          // Configures the Access-Control-Allow-Methods CORS header.
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          // Configures the Access-Control-Allow-Headers CORS header.
          allowedHeaders: [
            '*',
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization',
            'Access-Control-Allow-*',
          ],
          // Configures the Access-Control-Expose-Headers CORS header.
          exposedHeaders: [],
          // Configures the Access-Control-Allow-Credentials CORS header.
          credentials: true,
          // Configures the Access-Control-Max-Age CORS header.
          maxAge: 3600,
        },

        aliases: {
          'GET /openapi.json'(req: any, res: any) {
            // Send back the generated schema
            if (shouldUpdateSchema || !schema) {
              // Create new server & regenerate GraphQL schema
              this.logger.info('♻ Regenerate OpenAPI/Swagger schema...');

              try {
                schema = this.generateOpenAPISchema();

                shouldUpdateSchema = false;

                this.logger.debug(schema);

                if (process.env.NODE_ENV !== 'production') {
                  fs.writeFileSync('./openapi.json', JSON.stringify(schema, null, 4), 'utf8');
                }
              } catch (err) {
                this.logger.warn(err);
                this.sendError(req, res, err);
              }
            }

            const ctx = req.$ctx;
            ctx.meta.responseType = 'application/json';

            return this.sendResponse(ctx, '', req, res, schema);
          },
        },

        mappingPolicy: 'restrict',
      });

      // Add route
      this.settings.routes.unshift(route);
    },

    started() {
      return this.logger.info(
        `📜 OpenAPI Docs server is available at ${mixinOptions.routeOptions.path}`,
      );
    },
  };
}
