import { ServiceSchema } from 'moleculer';


export const PaymentsValidation: ServiceSchema = {
  'name': 'payments',
  'actions': {
    'add': {
      'params': {
        'id': [{
          'type': 'string',
        },
        {
          'type': 'number',
          'integer': true,
        },
        ],
        'payment_mode': {
          'type': 'string',
        },
        'amount': {
          'type': 'number',
        },
        'invoices': {
          'type': 'array',
          'item': {
            'type': 'object',
            'props': {
              'amount_applied': {
                'type': 'number',
                'convert': true,
              },
              'invoice_id': {
                'type': 'string',
              },
            },
          },
          'optional': true,
        },
        'account_id': {
          'type': 'string',
        },
        'bank_charges': {
          'type': 'number',
          'optional': true,
          'convert': true,
        },
        'reference': [{
          'type': 'string',
          'optional': true,
        },
        {
          'type': 'number',
          'integer': true,
          'optional': true,
        },
        ],
      },
    },
    'get': {
      'params': {
        'page': {
          'type': 'number',
          'integer': true,
          'optional': true,
          'convert': true,
        },
        'limit': {
          'type': 'number',
          'integer': true,
          'optional': true,
          'convert': true,
        },
        'reference_number': {
          'type': 'string',
          'optional': true,
        },
        'payment_mode': {
          'type': 'string',
          'optional': true,
        },
      },
    },
  },
};
