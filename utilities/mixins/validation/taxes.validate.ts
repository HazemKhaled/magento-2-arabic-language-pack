import { ServiceSchema } from 'moleculer';


export const TaxesValidation: ServiceSchema = {
  'name': 'taxes',
  'actions': {
    'tCreate': {
      'params': {
        'name': {
          'type': 'string',
        },
        'class': {
          'type': 'array',
          'items': {
            'type': 'string',
          },
        },
        'country': {
          'type': 'string',
          'min': 2,
          'max': 2,
          'pattern': {},
        },
        'percentage': {
          'type': 'number',
          'convert': true,
        },
        '$$strict': true,
      },
    },
    'tUpdate': {
      'params': {
        'id': {
          'type': 'string',
        },
        'name': {
          'type': 'string',
          'optional': true,
        },
        'class': {
          'type': 'array',
          'items': {
            'type': 'string',
          },
          'optional': true,
        },
        'country': {
          'type': 'string',
          'min': 2,
          'max': 2,
          'pattern': {},
          'optional': true,
        },
        'percentage': {
          'type': 'number',
          'convert': true,
          'optional': true,
        },
        '$$strict': true,
      },
    },
    'tFindByCountry': {
      'params': {
        'country': {
          'type': 'string',
          'min': 2,
          'max': 2,
          'pattern': {},
        },
        'class': [{
          'type': 'string',
          'optional': true,
        },
        {
          'type': 'array',
          'items': {
            'type': 'string',
          },
          'optional': true,
        },
        ],
        '$$strict': true,
      },
    },
    'tDelete': {
      'params': {
        'id': {
          'type': 'string',
        },
      },
    },
  },
};
