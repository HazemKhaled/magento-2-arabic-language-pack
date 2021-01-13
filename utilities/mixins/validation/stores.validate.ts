import { ServiceSchema } from 'moleculer';

export const StoresValidation: ServiceSchema = {
  name: 'stores',
  actions: {
    get: {
      params: {
        url: {
          type: 'url',
        },
        withoutBalance: {
          type: 'string',
          optional: true,
        },
        withoutSubscription: {
          type: 'string',
          optional: true,
        },
      },
    },
    list: {
      params: {
        pageSize: {
          type: 'number',
          optional: true,
          convert: true,
          min: 0,
        },
        page: {
          type: 'number',
          optional: true,
          convert: true,
          min: 1,
        },
        sort: {
          type: 'string',
          convert: true,
          optional: true,
        },
        query: {
          type: 'string',
          optional: true,
          convert: true,
        },
        fields: {
          type: 'string',
          optional: true,
          convert: true,
        },
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
            'pending',
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
            'magento2',
            'salla',
            'expandcart',
            'opencart',
            'shopify',
            'csv',
            'ebay',
            'api',
            'catalog',
            'zid',
            'youcan',
            'other',
          ],
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
          values: [1, 2],
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
                min: 3,
                optional: true,
                pattern: '^[A-Za-z ]{3,}$',
              },
              last_name: {
                type: 'string',
                min: 3,
                optional: true,
                pattern: '^[A-Za-z ]{3,}$',
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
                    'support',
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
          optional: true,
          props: {
            first_name: {
              type: 'string',
              min: 3,
              pattern: '^[A-Za-z ]{3,}$',
            },
            last_name: {
              type: 'string',
              min: 3,
              pattern: '^[A-Za-z ]{3,}$',
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
              type: 'string',
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
            taxNumber: {
              type: 'string',
              optional: true,
              convert: true,
            },
          },
        },
      },
    },
    update: {
      params: {
        url: {
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
            'pending',
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
            'magento2',
            'salla',
            'expandcart',
            'opencart',
            'shopify',
            'csv',
            'ebay',
            'api',
            'catalog',
            'zid',
            'youcan',
            'other',
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
          values: [1, 2],
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
          optional: true,
          items: {
            type: 'object',
            props: {
              first_name: {
                type: 'string',
                min: 3,
                optional: true,
                pattern: '^[A-Za-z ]{3,}$',
              },
              last_name: {
                type: 'string',
                min: 3,
                optional: true,
                pattern: '^[A-Za-z ]{3,}$',
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
                    'support',
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
          optional: true,
        },
        address: {
          type: 'object',
          optional: true,
          props: {
            first_name: {
              type: 'string',
              min: 3,
              pattern: '^[A-Za-z ]{3,}$',
            },
            last_name: {
              type: 'string',
              min: 3,
              pattern: '^[A-Za-z ]{3,}$',
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
              type: 'string',
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
            taxNumber: {
              type: 'string',
              optional: true,
              convert: true,
            },
          },
        },
      },
    },
    flushCache: {
      params: {
        url: {
          type: 'url',
        },
        timestamp: {
          type: 'string',
          optional: true,
        },
        $$strict: true,
      },
    },
    meUpdate: {
      params: {
        $$strict: true,
        logo: {
          type: 'url',
          optional: true,
        },
        status: {
          type: 'enum',
          values: [
            'pending',
            'confirmed',
            'unconfirmed',
            'uninstalled',
            'archived',
            'error',
          ],
          optional: true,
        },
        address: {
          type: 'object',
          strict: true,
          props: {
            first_name: {
              type: 'string',
              min: 3,
              optional: true,
              pattern: '^[A-Za-z ]{3,}$',
            },
            last_name: {
              type: 'string',
              min: 3,
              optional: true,
              pattern: '^[A-Za-z ]{3,}$',
            },
            company: {
              type: 'string',
              optional: true,
            },
            address_1: {
              type: 'string',
              min: 3,
              optional: true,
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
              type: 'string',
              optional: true,
            },
            country: {
              type: 'string',
              max: 2,
              optional: true,
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
            taxNumber: {
              type: 'string',
              optional: true,
              convert: true,
            },
          },
          optional: true,
        },
        currency: {
          type: 'string',
          max: 3,
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
          values: [1, 2],
          optional: true,
        },
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
  },
};
