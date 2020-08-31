import { ServiceSchema } from 'moleculer';

const Log = {
  type: 'object',
  required: ['code', 'topic'],
  properties: {
    topic: {
      type: 'string',
    },
    code: {
      type: 'number',
      example:
        '100 =>  Informational status response code indicates that everything so far is OK and that the client should continue with the request or ignore it if it is already finished.',
    },
    topicId: {
      type: 'string',
    },
    storeId: {
      type: 'string',
    },
    timestamp: {
      type: 'string',
      format: 'date',
    },
    message: {
      type: 'string',
    },
    logLevel: {
      type: 'string',
      enum: ['info', 'debug', 'warn', 'error'],
    },
    payload: {
      type: 'object',
    },
  },
};

const LogsAddOpenapi = {
  $path: 'post /logs',
  summary: 'Add Log',
  tags: ['Logs'],
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['success'],
              },
              message: {
                type: 'string',
              },
              id: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    401: { $ref: '#/components/responses/UnauthorizedErrorBasic' },
    500: { $ref: '#/components/responses/500' },
  },
  security: [{ basicAuth: [] as any[] }, { bearerAuth: [] as any[] }],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Log',
        },
      },
    },
    required: true,
  },
};

const LogsGetLogsOpenapi = {
  $path: 'get /logs',
  summary: 'Get Logs',
  tags: ['Logs'],
  parameters: [
    {
      name: 'topic',
      in: 'query',
      required: true,
      schema: {
        type: 'string',
      },
    },
    {
      name: 'topicId',
      in: 'query',
      description: 'Required if no storeId',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'storeId',
      in: 'query',
      description: 'Required if no topicId',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'logLevel',
      in: 'query',
      schema: {
        type: 'string',
        enum: ['info', 'debug', 'warn', 'error'],
      },
    },
    {
      name: 'sort',
      in: 'query',
      schema: {
        type: 'string',
        enum: ['asc', 'desc'],
      },
    },
    {
      name: 'limit',
      in: 'query',
      schema: {
        type: 'number',
        minimum: 1,
        maximum: 500,
        default: 10,
      },
    },
    {
      name: 'page',
      in: 'query',
      schema: {
        type: 'number',
        default: 1,
      },
    },
  ],
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Log',
            },
          },
        },
      },
    },
    401: { $ref: '#/components/responses/UnauthorizedErrorBasic' },
    404: { $ref: '#/components/responses/404' },
    500: { $ref: '#/components/responses/500' },
  },
  security: [{ basicAuth: [] as any[] }],
};

export const LogsOpenapi: ServiceSchema = {
  name: 'logs',
  settings: {
    openapi: {
      components: {
        schemas: {
          Log,
        },
      },
    },
  },
  actions: {
    add: {
      openapi: LogsAddOpenapi,
    },
    getLogs: {
      openapi: LogsGetLogsOpenapi,
    },
  },
};
