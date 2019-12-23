import { ServiceSchema } from 'moleculer';

export const MembershipValidation: ServiceSchema = {
  'name': 'membership',
  'actions': {
    'create': {
      'params': {
        'id': {
          'type': 'string',
          'optional': true,
        },
        'name': {
          'type': 'object',
          'props': {
            'tr': {
              'type': 'string',
              'optional': true,
            },
            'en': {
              'type': 'string',
            },
            'ar': {
              'type': 'string',
              'optional': true,
            },
            '$$strict': true,
          },
        },
        'tagline': {
          'type': 'object',
          'props': {
            'tr': {
              'type': 'string',
              'optional': true,
            },
            'en': {
              'type': 'string',
            },
            'ar': {
              'type': 'string',
              'optional': true,
            },
            '$$strict': true,
          },
        },
        'description': {
          'type': 'object',
          'props': {
            'tr': {
              'type': 'string',
              'optional': true,
            },
            'en': {
              'type': 'string',
            },
            'ar': {
              'type': 'string',
              'optional': true,
            },
            '$$strict': true,
          },
        },
        'sort': {
          'type': 'number',
          'integer': true,
          'positive': true,
        },
        'active': {
          'type': 'boolean',
        },
        'public': {
          'type': 'boolean',
        },
        'cost': {
          'type': 'number',
          'positive': true,
        },
        'discount': {
          'type': 'number',
          'positive': true,
        },
        'paymentFrequency': {
          'type': 'number',
          'integer': true,
          'positive': true,
        },
        'paymentFrequencyType': {
          'type': 'enum',
          'values': [
            'month',
            'year',
          ],
        },
        'attributes': {
          'type': 'object',
        },
        'isDefault': {
          'type': 'boolean',
          'optional': true,
        },
        '$$strict': true,
      },
    },
    'get': {
      'params': {
        'id': [{
          'type': 'string',
        },
        {
          'type': 'number',
        },
        ],
      },
    },
    'update': {
      'params': {
        'id': {
          'type': 'string',
        },
        'name': {
          'type': 'object',
          'props': {
            'tr': {
              'type': 'string',
              'optional': true,
            },
            'en': {
              'type': 'string',
              'optional': true,
            },
            'ar': {
              'type': 'string',
              'optional': true,
            },
            '$$strict': true,
          },
          'optional': true,
        },
        'tagline': {
          'type': 'object',
          'props': {
            'tr': {
              'type': 'string',
              'optional': true,
            },
            'en': {
              'type': 'string',
              'optional': true,
            },
            'ar': {
              'type': 'string',
              'optional': true,
            },
            '$$strict': true,
          },
          'optional': true,
        },
        'description': {
          'type': 'object',
          'props': {
            'tr': {
              'type': 'string',
              'optional': true,
            },
            'en': {
              'type': 'string',
              'optional': true,
            },
            'ar': {
              'type': 'string',
              'optional': true,
            },
            '$$strict': true,
          },
          'optional': true,
        },
        'sort': {
          'type': 'number',
          'integer': true,
          'positive': true,
          'optional': true,
        },
        'active': {
          'type': 'boolean',
          'optional': true,
        },
        'public': {
          'type': 'boolean',
          'optional': true,
        },
        'cost': {
          'type': 'number',
          'positive': true,
          'optional': true,
        },
        'discount': {
          'type': 'number',
          'positive': true,
          'optional': true,
        },
        'paymentFrequency': {
          'type': 'number',
          'integer': true,
          'positive': true,
          'optional': true,
        },
        'paymentFrequencyType': {
          'type': 'enum',
          'values': [
            'month',
            'year',
          ],
          'optional': true,
        },
        'attributes': {
          'type': 'object',
          'optional': true,
        },
        'isDefault': {
          'type': 'boolean',
          'optional': true,
        },
        '$$strict': true,
      },
    },
  },
};
