import { ServiceSchema } from 'moleculer';


export const StoresValidation: ServiceSchema = {
  name: 'stores',
  actions: {
    findInstance: {
      params: {
        consumerKey: {
          type: 'string',
          convert: true,
          optional: true,
        },
        id: {
          type: 'string',
          convert: true,
          optional: true,
        },
      },
    },
    get: {
      params: {
        id: {
          type: 'string',
        },
      },
    },
    list: {
      params: {
        filter: {
          type: 'string',
        },
      },
    },
    storesList: {
      params: {
        id: {
          type: 'string',
          optional: true,
        },
        page: {
          type: 'number',
          optional: true,
          positive: true,
          convert: true,
          integer: true,
        },
        perPage: {
          type: 'number',
          optional: true,
          positive: true,
          convert: true,
          integer: true,
        },
      },
    },
    countStores: {
      params: {
        query: 'object',
      },
    },
    create: {
      params: {
        url: {
          type: 'url',
        },
        name: {
          type: 'string',
        },
        logo: {
          type: 'url',
          optional: true,
        },
        status: {
          type: 'enum',
          values: [
            'confirmed',
            'unconfirmed',
            'uninstalled',
            'archived',
            'error',
          ],
        },
        type: {
          type: 'enum',
          values: [
            'woocommerce',
            'magento1',
            'magento2',
            'salla',
            'expandcart',
            'opencart',
            'shopify',
            'csv',
            'ebay',
            'api',
            'catalog',
            'other',
          ],
        },
        stock_date: {
          type: 'date',
          optional: true,
          convert: true,
        },
        stock_status: {
          type: 'enum',
          values: [
            'idle',
            'in-progress',
          ],
          optional: true,
        },
        price_date: {
          type: 'date',
          optional: true,
          convert: true,
        },
        price_status: {
          type: 'enum',
          values: [
            'idle',
            'in-progress',
          ],
          optional: true,
        },
        sale_price: {
          type: 'number',
          optional: true,
        },
        sale_price_operator: {
          type: 'number',
          optional: true,
        },
        compared_at_price: {
          type: 'number',
          optional: true,
        },
        compared_at_price_operator: {
          type: 'enum',
          values: [
            1,
            2,
          ],
          optional: true,
        },
        currency: {
          type: 'string',
          max: 3,
          optional: true,
        },
        external_data: {
          type: 'object',
          optional: true,
        },
        internal_data: {
          type: 'object',
          optional: true,
        },
        users: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              first_name: {
                type: 'string',
                optional: true,
              },
              last_name: {
                type: 'string',
                optional: true,
              },
              email: {
                type: 'email',
              },
              roles: {
                type: 'array',
                items: {
                  type: 'enum',
                  values: [
                    'owner',
                    'accounting',
                    'products',
                    'orders',
                  ],
                },
              },
            },
          },
        },
        languages: {
          type: 'array',
          min: 1,
          max: 10,
          items: 'string',
        },
        address: {
          type: 'object',
          props: {
            first_name: {
              type: 'string',
              min: 3,
            },
            last_name: {
              type: 'string',
              min: 3,
            },
            company: {
              type: 'string',
              optional: true,
            },
            address_1: {
              type: 'string',
              min: 3,
            },
            address_2: {
              type: 'string',
              optional: true,
            },
            city: {
              type: 'string',
              optional: true,
            },
            state: {
              type: 'string',
              optional: true,
            },
            postcode: {
              type: 'number',
              optional: true,
            },
            country: {
              type: 'string',
              max: 2,
            },
            email: {
              type: 'email',
              optional: true,
            },
            phone: {
              type: 'string',
              optional: true,
              convert: true,
            },
          },
          optional: true,
        },
      },
    },
    update: {
      params: {
        id: {
          type: 'url',
        },
        name: {
          type: 'string',
          optional: true,
        },
        logo: {
          type: 'url',
          optional: true,
        },
        status: {
          type: 'enum',
          values: [
            'confirmed',
            'unconfirmed',
            'uninstalled',
            'archived',
            'error',
          ],
          optional: true,
        },
        type: {
          type: 'enum',
          values: [
            'woocommerce',
            'magento1',
            'magento2',
            'salla',
            'expandcart',
            'opencart',
            'shopify',
            'csv',
            'ebay',
            'api',
            'catalog',
            'other',
          ],
          optional: true,
        },
        stock_date: {
          type: 'date',
          optional: true,
          convert: true,
        },
        stock_status: {
          type: 'enum',
          values: [
            'idle',
            'in-progress',
          ],
          optional: true,
        },
        price_date: {
          type: 'date',
          optional: true,
          convert: true,
        },
        price_status: {
          type: 'enum',
          values: [
            'idle',
            'in-progress',
          ],
          optional: true,
        },
        sale_price: {
          type: 'number',
          optional: true,
        },
        sale_price_operator: {
          type: 'number',
          optional: true,
        },
        compared_at_price: {
          type: 'number',
          optional: true,
        },
        compared_at_price_operator: {
          type: 'enum',
          values: [
            1,
            2,
          ],
          optional: true,
        },
        currency: {
          type: 'string',
          max: 3,
          optional: true,
        },
        external_data: {
          type: 'object',
          optional: true,
        },
        internal_data: {
          type: 'object',
          optional: true,
        },
        users: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              first_name: {
                type: 'string',
                optional: true,
              },
              last_name: {
                type: 'string',
                optional: true,
              },
              email: {
                type: 'email',
              },
              roles: {
                type: 'array',
                items: {
                  type: 'enum',
                  values: [
                    'owner',
                    'accounting',
                    'products',
                    'orders',
                  ],
                },
              },
            },
          },
          optional: true,
        },
        languages: {
          type: 'array',
          min: 1,
          max: 10,
          items: 'string',
          optional: true,
        },
        address: {
          type: 'object',
          props: {
            first_name: {
              type: 'string',
            },
            last_name: {
              type: 'string',
            },
            company: {
              type: 'string',
              optional: true,
            },
            address_1: {
              type: 'string',
            },
            address_2: {
              type: 'string',
              optional: true,
            },
            city: {
              type: 'string',
              optional: true,
            },
            state: {
              type: 'string',
              optional: true,
            },
            postcode: {
              type: 'number',
              optional: true,
            },
            country: {
              type: 'string',
              max: 2,
            },
            email: {
              type: 'email',
              optional: true,
            },
            phone: {
              type: 'string',
              optional: true,
              convert: true,
            },
          },
          optional: true,
        },
      },
    },
    sync: {
      params: {
        id: {
          type: 'string',
        },
        timestamp: {
          type: 'string',
          optional: true,
        },
        $$strict: true,
      },
    },
    login: {
      params: {
        consumerKey: {
          type: 'string',
        },
        consumerSecret: {
          type: 'string',
        },
      },
    },
    resolveBearerToken: {
      params: {
        token: 'string',
      },
    },
    resolveBasicToken: {
      params: {
        token: 'string',
      },
    },
  },
};
