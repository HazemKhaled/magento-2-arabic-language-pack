import { ServiceSchema } from 'moleculer';


export const ProductsValidation: ServiceSchema = {
  name: 'products-list',
  actions: {
    getBySku: {
      params: {
        sku: 'string',
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
        price_to: {
          type: 'number',
          convert: true,
          integer: true,
          empty: false,
          optional: true,
        },
        price_from: {
          type: 'number',
          convert: true,
          integer: true,
          empty: false,
          optional: true,
        },
        keywordLang: {
          type: 'array',
          optional: true,
          items: {
            type: 'string',
            min: 2,
            max: 2,
          },
        },
        keyword: {
          type: 'string',
          optional: true,
        },
        category_id: {
          type: 'number',
          convert: true,
          integer: true,
          min: -1,
          optional: true,
        },
        sortBy: {
          type: 'string',
          optional: true,
        },
        images: {
          type: 'number',
          optional: true,
          integer: true,
          max: 15,
          min: 0,
          empty: false,
          convert: true,
        },
      },
    },
    getProductsByVariationSku: {
      params: {
        skus: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
    updateQuantityAttributes: {
      params: {
        products: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              id: {
                type: 'string',
                convert: true,
              },
              qty: {
                type: 'number',
                convert: true,
              },
              attribute: {
                type: 'string',
                convert: true,
              },
              imported: {
                type: 'array',
                items: {
                  type: 'string',
                },
                optional: true,
              },
            },
          },
        },
      },
    },
  },
};
