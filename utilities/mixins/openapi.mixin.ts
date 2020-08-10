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
  let shouldUpdateSchemaPrivate = true;
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
        shouldUpdateSchemaPrivate = true;
      },

      /**
       * Generate OpenAPI Schema
       */
      generateOpenAPISchema({ bearerOnly }: { bearerOnly: boolean }) {
        try {
          const res = _.defaultsDeep(mixinOptions.schema, {
            openapi: '3.0.3',

            // https://swagger.io/specification/#infoObject
            info: {
              title: `${pkg.name.toUpperCase()} API Documentation`,
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
              description:
                'Welcome to the Knawat MP documentation. Navigate through the documentation to learn more. If you encounter any problems when using our APIs, send us an email it@knawat.com;\n\n' +
                '## What is Knawat?\n\n' +
                'Knawat is a Drop-Shipping platform. We are bringing hundreds of thousands of products to let you list in your e-commerce store. We also do all operations behind the e-commerce, so once you receive an order, we will ship it to your customer with your invoice.\n\n' +
                '## What is Knawat MP API?\n\n' +
                'Knawat MP APIs mainly for e-commerce stores, allows you to aggregate products to your store, update stock and prices, and send us your orders.\n\n' +
                '## Knawat API rate limit\n\n' +
                'To ensure Knawat APIs works stable for all our users, all our APIs are rate-limited. We use [leaky bucket](https://en.wikipedia.org/wiki/Leaky_bucket) algorithm to manage requests. Each store limited to 2 requests/second. We ask developers to optimize their requests, cache results, and re-trying requests when needed.\n\n' +
                '## Support and Chat\n\n' +
                'We are happy to receive your questions. click here to [chat with us](https://gitter.im/Knawat/Lobby)',
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
                },
                404: { description: 'Entity not found.' },
                500: {
                  description: 'Internal Error.',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/Error' },
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
                    'Knawat provide extra endpoint for private use, let us know if you really need access to Knawat Private APIs.',
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
            ],

            // https://swagger.io/specification/#externalDocumentationObject
            externalDocs: {
              description: 'Find more info here',
              url: 'https://docs.knawat.io',
            },
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
              if (!action.openapi && !_.isObject(action.openapi)) {
                return;
              }

              // Hide basic endpoint
              if (bearerOnly && !action.openapi?.security[0]?.bearerAuth) {
                return;
              }

              // console.log(action.openapi.security[0].bearerAuth);
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
                schema = this.generateOpenAPISchema({ bearerOnly: true });

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
          'GET /openapi-private.json'(req: any, res: any) {
            // Send back the generated schema
            if (shouldUpdateSchemaPrivate || !schema) {
              // Create new server & regenerate GraphQL schema
              this.logger.info('♻ Regenerate OpenAPI/Swagger schema...');

              try {
                schema = this.generateOpenAPISchema({ bearerOnly: false });

                shouldUpdateSchemaPrivate = false;

                this.logger.debug(schema);

                if (process.env.NODE_ENV !== 'production') {
                  fs.writeFileSync('./openapi-private.json', JSON.stringify(schema, null, 4), 'utf8');
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
