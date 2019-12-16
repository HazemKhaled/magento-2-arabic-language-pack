import { ServiceSchema } from 'moleculer';


export const UsersValidation: ServiceSchema = {
  'name': 'users',
  'actions': {
    'login': {
      'params': {
        'consumerKey': {
          'type': 'string',
        },
        'consumerSecret': {
          'type': 'string',
        },
      },
    },
    'resolveBearerToken': {
      'params': {
        'token': 'string',
      },
    },
    'resolveBasicToken': {
      'params': {
        'token': 'string',
      },
    },
  },
};
