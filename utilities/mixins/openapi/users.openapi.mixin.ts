import { ServiceSchema } from 'moleculer';

const UsersLoginOpenapi = {
  $path: 'post /token',
  summary: 'Get token',
  tags: ['Authentication'],
  responses: {
    '200': {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            description: 'Channel information',
            properties: {
              channel: {
                type: 'object',
              },
            },
          },
        },
      },
    },
    '422': {
      description: 'Status 422',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            description: 'consumerKey or consumerSecret is wrong',
          },
        },
      },
    },
  },
  security: [] as [],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['consumerKey', 'consumerSecret'],
          properties: {
            consumerKey: {
              type: 'string',
            },
            consumerSecret: {
              type: 'string',
            },
          },
        },
      },
    },
    required: true,
  },
};

export const UsersOpenapi: ServiceSchema = {
  name: 'users',
  actions: {
    login: {
      openapi: UsersLoginOpenapi,
    },
  },
};
