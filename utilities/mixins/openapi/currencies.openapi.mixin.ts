import { ServiceSchema } from 'moleculer';

const CurrencySettingsOpenapi = {
  components: {
    schemas: {
      Currency: {
        type: 'object',
        properties: {
          currencyCode: {
            type: 'string',
          },
          rate: {
            type: 'number',
          },
        },
      },
    },
  },
};

const CurrenciesGetCurrencyOpenapi = {
  $path: 'get /currencies/{currencyCode}',
  summary: 'Get Currency By Code',
  tags: ['Currencies', 'Enterprise Only'],
  description: 'Gets currency code, name and rate',
  parameters: [
    {
      name: 'currencyCode',
      in: 'query',
      required: false,
      schema: {
        type: 'string',
        minLength: 3,
        maxLength: 3,
      },
    },
    {
      name: 'currencyCode',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
      },
    },
  ],
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Currency',
          },
        },
      },
    },
    401: {
      $ref: '#/components/responses/UnauthorizedErrorBasic',
    },
    404: {
      description: 'Status 404',
    },
  },
  security: [
    {
      basicAuth: [] as any[],
    },
  ],
};

const CurrenciesGetCurrenciesOpenapi = {
  $path: 'get /currencies',
  summary: 'Get Currencies',
  tags: ['Currencies', 'Enterprise Only'],
  description: 'Get all currencies with names, code and rates info',
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Currency',
            },
          },
        },
      },
    },
    401: {
      $ref: '#/components/responses/UnauthorizedErrorBasic',
    },
  },
  security: [
    {
      basicAuth: [] as any[],
    },
  ],
};

export const CurrenciesOpenapi: ServiceSchema = {
  name: 'currencies',
  settings: {
    openapi: CurrencySettingsOpenapi,
  },
  actions: {
    getCurrency: {
      openapi: CurrenciesGetCurrencyOpenapi,
    },
    getCurrencies: {
      openapi: CurrenciesGetCurrenciesOpenapi,
    },
  },
};
