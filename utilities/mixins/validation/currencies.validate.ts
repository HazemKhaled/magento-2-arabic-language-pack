import { ServiceSchema } from 'moleculer';

export const CurrenciesValidation: ServiceSchema = {
  'name': 'currencies',
  'actions': {
    'getCurrency': {
      'params': {
        'currencyCode': {
          'type': 'string',
          'min': 3,
          'max': 3,
        },
      },
    },
  },
};
