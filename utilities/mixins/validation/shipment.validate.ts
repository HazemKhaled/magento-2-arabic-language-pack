import { ServiceSchema } from 'moleculer';

import country from '../../static/country';

export const ShipmentValidation: ServiceSchema = {
  name: 'shipment',
  actions: {
    getAll: {
      params: {
        id: {
          type: 'string',
          optional: true,
        },
      },
    },
    createOne: {
      params: {
        name: {
          type: 'string',
        },
        countries: {
          type: 'array',
          items: {
            type: 'enum',
            values: country,
            pattern: '[A-Z]',
          },
        },
        rules: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              courier: {
                type: 'string',
              },
              delivery_days_min: {
                type: 'number',
                convert: true,
              },
              delivery_days_max: {
                type: 'number',
                convert: true,
              },
              units_min: {
                type: 'number',
                convert: true,
              },
              units_max: {
                type: 'number',
                convert: true,
              },
              type: {
                type: 'enum',
                values: ['weight', 'price'],
              },
              cost: {
                type: 'number',
                convert: true,
              },
            },
          },
        },
        ship_from: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              city: {
                type: 'string',
                pattern: /([A-Za-z* ])$/,
              },
              country: {
                type: 'enum',
                values: country,
                pattern: '[A-Z]',
              },
            },
          },
        },
      },
    },
    updateOne: {
      params: {
        id: {
          type: 'string',
        },
        countries: {
          type: 'array',
          items: {
            type: 'enum',
            values: country,
            pattern: '[A-Z]',
          },
        },
        rules: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              courier: {
                type: 'string',
              },
              delivery_days_min: {
                type: 'number',
                convert: true,
              },
              delivery_days_max: {
                type: 'number',
                convert: true,
              },
              units_min: {
                type: 'number',
                convert: true,
              },
              units_max: {
                type: 'number',
                convert: true,
              },
              type: {
                type: 'enum',
                values: ['weight', 'price'],
              },
              cost: {
                type: 'number',
                convert: true,
              },
            },
          },
        },
        ship_from: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              city: {
                type: 'string',
                pattern: /([A-Za-z* ])$/,
              },
              country: {
                type: 'enum',
                values: country,
                pattern: '[A-Z]',
              },
            },
          },
        },
      },
    },
    getAllRuleByCountry: {
      params: {
        country: {
          type: 'enum',
          values: country,
        },
        weight: {
          type: 'number',
          convert: true,
        },
        price: {
          type: 'number',
          convert: true,
        },
        ship_from_city: {
          type: 'string',
          optional: true,
        },
        ship_from_country: {
          type: 'string',
          optional: true,
        },
      },
    },
    getAllCouriers: {
      params: {
        country: {
          type: 'enum',
          values: country,
          optional: true,
        },
      },
    },
  },
};
