import { Context, ServiceSchema } from 'moleculer';
import ESService from 'moleculer-elasticsearch';
import { v1 as uuidv1 } from 'uuid';
import { Log } from '../utilities/types';

const TheService: ServiceSchema = {
  name: 'logs',
  /**
   * Service settings
   */
  settings: {
    elasticsearch: {
      host: `http://${process.env.ELASTIC_AUTH}@${process.env.ELASTIC_HOST}:${
        process.env.ELASTIC_PORT
      }`,
      apiVersion: process.env.ELASTIC_VERSION || '6.x'
    }
  },
  mixins: [ESService],
  actions: {
    add: {
      openapi: {
        $path: 'post /logs',
        summary: 'Add Log',
        tags: ['Shipment', 'Enterprise Only'],
        responses: {
          '200': {
            description: 'Status 200',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['success']
                    },
                    message: {
                      type: 'string'
                    },
                    id: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/UnauthorizedErrorBasic'
          },
          '500': {
            description: 'Status 500',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['failed']
                    },
                    message: {
                      type: 'string'
                    },
                    code: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        },
        security: [
          {
            basicAuth: []
          }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Log'
              }
            }
          },
          required: true
        }
      },
      auth: 'Basic',
      params: {
        topic: { type: 'string' },
        message: { type: 'string' },
        logLevel: { type: 'enum', values: ['info', 'debug', 'error', 'warn'] },
        storeId: { type: 'string' },
        topicId: [
          { type: 'string', optional: true },
          { type: 'number', optional: true, convert: true, integer: true }
        ],
        payload: { type: 'object', optional: true },
        code: { type: 'number', convert: true, integer: true }
        // Remove until it's added to index.d
        // $$strict: true
      },
      handler(ctx: Context) {
        const date = new Date();
        return ctx
          .call('logs.create', {
            index: `logsmp-${date.getFullYear()}-${date.getMonth() < 9 ? 0 : ''}${date.getMonth() +
              1}-${date.getDate() < 10 ? 0 : ''}${date.getDate()}`,
            type: '_doc',
            id: uuidv1(),
            body: {
              topic: ctx.params.topic,
              topicId: ctx.params.topicId,
              '@timestamp': date,
              logLevel: ctx.params.logLevel,
              storeId: ctx.params.storeId,
              message: ctx.params.message,
              payload: ctx.params.payload,
              code: ctx.params.code
            }
          })
          .then(res => {
            if (res.result === 'created')
              return {
                status: 'success',
                message: 'created',
                id: res._id
              };
            ctx.meta.$statusCode = 500;
            ctx.meta.$statusMessage = 'Internal Server Error';
            return {
              status: 'failed',
              message: 'Something went wrong! Please contact customer support with the error code.',
              code: res.code || 999
            };
          });
      }
    },
    getLogs: {
      openapi: {
        $path: 'get /logs',
        summary: 'Get Logs',
        tags: ['Shipment', 'Enterprise Only'],
        parameters: [
          {
            name: 'topic',
            in: 'query',
            required: true,
            schema: {
              type: 'string'
            }
          },
          {
            name: 'topicId',
            in: 'query',
            required: false,
            description: 'Required if no storeId',
            schema: {
              type: 'string'
            }
          },
          {
            name: 'storeId',
            in: 'query',
            required: false,
            description: 'Required if no topicId',
            schema: {
              type: 'string'
            }
          },
          {
            name: 'logLevel',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['info', 'debug', 'warn', 'error']
            }
          },
          {
            name: 'sort',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['asc', 'desc']
            }
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: {
              type: 'number',
              minimum: 1,
              maximum: 500,
              default: 10
            }
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: {
              type: 'number',
              default: 1
            }
          }
        ],
        responses: {
          '200': {
            description: 'Status 200',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Log'
                  }
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/UnauthorizedErrorBasic'
          },
          '404': {
            description: 'Status 404',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          },
          '500': {
            description: 'Status 500',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string'
                    },
                    code: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        },
        security: [
          {
            basicAuth: []
          }
        ]
      },
      auth: 'Basic',
      params: {
        topic: { type: 'string', optional: true },
        sort: { type: 'enum', values: ['asc', 'desc'], optional: true },
        logLevel: { type: 'enum', values: ['info', 'debug', 'error', 'warn'], optional: true },
        storeId: [
          { type: 'string', optional: true },
          { type: 'number', optional: true, convert: true, integer: true }
        ],
        topicId: { type: 'string', optional: true },
        limit: { type: 'number', optional: true, min: 1, max: 500, convert: true },
        page: { type: 'number', optional: true, min: 1, convert: true }
        // Remove until it's added to index.d
        // $$strict: true
      },
      handler(ctx: Context) {
        const body: {
          size?: number;
          from?: number;
          query?: { [key: string]: {} };
          sort?: { [key: string]: string };
        } = {};
        const query: { bool?: { filter?: Array<{}> } } = { bool: { filter: [] } };
        if (ctx.params.limit) body.size = parseInt(ctx.params.limit, 10);
        if (ctx.params.sort) body.sort = { '@timestamp': ctx.params.sort };
        if (ctx.params.topic) query.bool.filter.push({ term: { topic: ctx.params.topic } });
        if (ctx.params.topicId) query.bool.filter.push({ term: { topicId: ctx.params.topicId } });
        if (ctx.params.storeId)
          query.bool.filter.push({ term: { 'storeId.keyword': ctx.params.storeId } });
        if (ctx.params.page)
          body.from = parseInt(ctx.params.page, 10) * parseInt(ctx.params.limit, 10);
        if (ctx.params.logLevel) {
          const logLevel: string[] = ['error'];
          switch (ctx.params.logLevel) {
            case 'debug':
              logLevel.push('debug');
            case 'info':
              logLevel.push('info');
            case 'warn':
              logLevel.push('warn');
          }
          query.bool.filter.push({ terms: { logLevel } });
        }
        body.query = query;
        return ctx
          .call('logs.search', {
            index: 'logsmp-*',
            body
          })
          .then(res => {
            if (res.hits.total > 0)
              return res.hits.hits.map((item: { _source: Log }) => item._source);
            if (res.hits.total === 0) {
              ctx.meta.$statusCode = 404;
              ctx.meta.$statusMessage = 'Not Found';
              return {
                message: 'No record found!'
              };
            }
            ctx.meta.$statusCode = 500;
            ctx.meta.$statusMessage = 'Internal Server Error';
            return {
              message: 'Something went wrong! Please contact customer support with the error code.',
              code: res.code || 999
            };
          });
      }
    }
  }
};

export = TheService;
