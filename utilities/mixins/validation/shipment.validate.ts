import { ServiceSchema } from 'moleculer';


export const ShipmentValidation: ServiceSchema = {
  name: 'shipment',
  actions: {
    getShipments: {
      params: {
        id: {
          type: 'string',
          optional: true,
        },
      },
    },
    insertShipment: {
      params: {
        name: {
          type: 'string',
        },
        countries: {
          type: 'array',
          items: {
            type: 'string',
            max: 2,
            min: 2,
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
                values: [
                  'weight',
                  'price',
                ],
              },
              cost: {
                type: 'number',
                convert: true,
              },
            },
          },
        },
      },
    },
    updateShipment: {
      params: {
        id: {
          type: 'string',
        },
        countries: {
          type: 'array',
          items: {
            type: 'string',
            max: 2,
            min: 2,
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
                values: [
                  'weight',
                  'price',
                ],
              },
              cost: {
                type: 'number',
                convert: true,
              },
            },
          },
        },
      },
    },
    ruleByCountry: {
      params: {
        country: {
          type: 'string',
        },
        weight: {
          type: 'number',
          convert: true,
        },
        price: {
          type: 'number',
          convert: true,
        },
      },
    },
    getCouriers: {
      params: {
        country: {
          type: 'string',
          optional: true,
          min: 2,
          max: 2,
        },
      },
    },
  },
};
