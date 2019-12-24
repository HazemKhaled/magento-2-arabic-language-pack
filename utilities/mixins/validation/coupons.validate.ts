import { ServiceSchema } from 'moleculer';

export const CouponsValidation: ServiceSchema = {
  'name': 'coupons',
  'actions': {
    'create': {
      'params': {
        'code': {
          'type': 'string',
          'pattern': '[A-Z]',
        },
        'discount': {
          'type': 'number',
          'positive': true,
        },
        'discountType': {
          'type': 'enum',
          'values': [
            '$',
            '%',
          ],
        },
        'startDate': {
          'type': 'date',
          'convert': true,
        },
        'endDate': {
          'type': 'date',
          'convert': true,
        },
        'maxUses': {
          'type': 'number',
          'integer': true,
          'positive': true,
        },
        'appliedMemberships': {
          'type': 'array',
          'items': {
            'type': 'string',
          },
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
        'membership': {
          'type': 'string',
          'optional': true,
        },
      },
    },
    'update': {
      'params': {
        'id': {
          'type': 'string',
        },
        'discount': {
          'type': 'number',
          'positive': true,
          'optional': true,
        },
        'discountType': {
          'type': 'enum',
          'values': [
            '$',
            '%',
          ],
          'optional': true,
        },
        'startDate': {
          'type': 'date',
          'convert': true,
          'optional': true,
        },
        'endDate': {
          'type': 'date',
          'convert': true,
          'optional': true,
        },
        'maxUses': {
          'type': 'number',
          'integer': true,
          'positive': true,
          'optional': true,
        },
        'appliedMemberships': {
          'type': 'array',
          'items': {
            'type': 'string',
          },
          'optional': true,
        },
        '$$strict': true,
      },
    },
    'updateCount': {
      'params': {
        'id': {
          'type': 'string',
        },
      },
    },
  },
};
