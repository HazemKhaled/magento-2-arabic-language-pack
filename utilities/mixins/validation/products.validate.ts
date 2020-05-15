import { ServiceSchema } from 'moleculer';


export const ProductsValidation: ServiceSchema = {
  name: 'products',
  actions: {
    getInstanceProduct: {
      params: {
        sku: {
          type: 'string',
        },
        currency: {
          type: 'string',
          optional: true,
          min: 3,
          max: 3,
        },
      },
    },
    list: {
      params: {
        limit: {
          type: 'number',
          convert: true,
          integer: true,
          min: 1,
          max: 100,
          optional: true,
        },
        page: {
          type: 'number',
          convert: true,
          integer: true,
          min: 1,
          optional: true,
        },
        lastupdate: {
          type: 'string',
          empty: false,
          optional: true,
        },
        hideOutOfStock: {
          type: 'number',
          empty: false,
          convert: true,
          optional: true,
        },
        keyword: {
          type: 'string',
          optional: true,
        },
        externalId: {
          type: 'string',
          optional: true,
        },
        hasExternalId: {
          type: 'enum',
          values: ['0', '1'],
          optional: true,
        },
        currency: {
          type: 'string',
          optional: true,
          min: 3,
          max: 3,
        },
      },
    },
    deleteInstanceProduct: {
      params: {
        sku: {
          type: 'string',
        },
      },
    },
    'import': {
      params: {
        products: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              sku: {
                type: 'string',
                convert: true,
              },
            },
          },
          max: 1000,
          min: 1,
        },
      },
    },
    instanceUpdate: {
      params: {
        sku: {
          type: 'string',
          convert: true,
        },
        externalUrl: {
          type: 'string',
          optional: true,
        },
        externalId: {
          type: 'number',
          convert: true,
          optional: true,
        },
        errors: {
          type: 'array',
          optional: true,
          items: {
            type: 'string',
          },
        },
        variations: {
          type: 'array',
          optional: true,
          items: {
            type: 'object',
            props: {
              sku: {
                type: 'string',
                convert: true,
                optional: true,
              },
              externalId: {
                type: 'number',
                optional: true,
                convert: true,
              },
              errors: {
                type: 'array',
                optional: true,
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
    bulkProductInstance: {
      params: {
        productInstances: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              sku: {
                type: 'string',
                convert: true,
              },
              externalUrl: {
                type: 'string',
                optional: true,
              },
              externalId: {
                type: 'string',
                convert: true,
                optional: true,
              },
              error: {
                type: 'array',
                optional: true,
                items: {
                  type: 'string',
                },
              },
              variations: {
                type: 'array',
                optional: true,
                items: {
                  type: 'object',
                  props: {
                    sku: {
                      type: 'string',
                      convert: true,
                      optional: true,
                    },
                    externalId: {
                      type: 'string',
                      optional: true,
                      convert: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
