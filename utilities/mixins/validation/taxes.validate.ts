import { ServiceSchema } from 'moleculer';


export const TaxesValidation: ServiceSchema = {
  name: 'taxes',
  actions: {
    tCreate: {
      params: {
        name: {
          type: 'string',
        },
        'class': {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        country: {
          type: 'string',
          pattern: '^[A-Z]{2}$',
        },
        percentage: {
          type: 'number',
          convert: true,
        },
        isInclusive: {type: 'boolean'},
        $$strict: true,
      },
    },
    tUpdate: {
      params: {
        id: {
          type: 'string',
        },
        name: {
          type: 'string',
          optional: true,
        },
        'class': {
          type: 'array',
          items: {
            type: 'string',
          },
          optional: true,
        },
        country: {
          type: 'string',
          pattern: '^[A-Z]{2}$',
          optional: true,
        },
        percentage: {
          type: 'number',
          convert: true,
          optional: true,
        },
        isInclusive: {type: 'boolean', optional: true},
        $$strict: true,
      },
    },
    tGet: {
      params: {
        id: 'string',
      },
    },
    tList: {
      params: {
        page: {
          type: 'number',
          integer: true,
          convert: true,
          optional: true,
        },
        perPage: {
          type: 'number',
          integer: true,
          convert: true,
          max: 100,
          optional: true,
        },
        country: {
          type: 'string',
          pattern: '^[a-zA-Z]{2}$',
          optional: true,
        },
        'class': [{
          type: 'string',
          optional: true,
        },
        {
          type: 'array',
          items: {
            type: 'string',
          },
          optional: true,
        },
        ],
        $$strict: true,
      },
    },
    tDelete: {
      params: {
        id: {
          type: 'string',
        },
      },
    },
  },
};
