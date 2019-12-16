import { ServiceSchema } from 'moleculer';


export const LogsValidation: ServiceSchema = {
  'name': 'logs',
  'actions': {
    'add': {
      'params': {
        'topic': {
          'type': 'string',
        },
        'message': {
          'type': 'string',
        },
        'logLevel': {
          'type': 'enum',
          'values': [
            'info',
            'debug',
            'error',
            'warn',
          ],
        },
        'storeId': {
          'type': 'string',
        },
        'topicId': [{
          'type': 'string',
          'optional': true,
        },
        {
          'type': 'number',
          'optional': true,
          'convert': true,
          'integer': true,
        },
        ],
        'payload': {
          'type': 'object',
          'optional': true,
        },
        'code': {
          'type': 'number',
          'convert': true,
          'integer': true,
        },
      },
    },
    'getLogs': {
      'params': {
        'topic': {
          'type': 'string',
          'optional': true,
        },
        'sort': {
          'type': 'enum',
          'values': [
            'asc',
            'desc',
          ],
          'optional': true,
        },
        'logLevel': {
          'type': 'enum',
          'values': [
            'info',
            'debug',
            'error',
            'warn',
          ],
          'optional': true,
        },
        'storeId': [{
          'type': 'string',
          'optional': true,
        },
        {
          'type': 'number',
          'optional': true,
          'convert': true,
          'integer': true,
        },
        ],
        'topicId': {
          'type': 'string',
          'optional': true,
        },
        'limit': {
          'type': 'number',
          'optional': true,
          'min': 1,
          'max': 500,
          'convert': true,
        },
        'page': {
          'type': 'number',
          'optional': true,
          'min': 1,
          'convert': true,
        },
      },
    },
  },
};
