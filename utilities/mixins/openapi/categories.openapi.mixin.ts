import { ServiceSchema } from 'moleculer';

const CategoriesSettingsOpenapi = {
  components: {
    schemas: {
      Category: {
        type: 'array',
        items: {
          required: ['id', 'name'],
          type: 'object',
          properties: {
            id: {
              type: 'number',
            },
            name: {
              type: 'object',
              properties: {
                tr: {
                  type: 'string',
                },
                en: {
                  type: 'string',
                },
                ar: {
                  type: 'string',
                },
              },
            },
            treeNodeLevel: {
              type: 'number',
            },
            productsCount: {
              type: 'number',
            },
            parentId: {
              type: 'number',
            },
          },
        },
        example: [
          {
            id: 4857,
            name: {
              tr: 'Ayakkabı',
              en: 'Shoes',
              ar: 'حذاء',
            },
            parentId: 32423,
            productsCount: 352,
            treeNodeLevel: 1,
          },
          {
            id: 4859,
            name: {
              tr: 'Ayakkabı / Kadın',
              en: 'Shoes / Women',
              ar: 'حذاء / نسائي',
            },
            parentId: 2435,
            productsCount: 456,
            treeNodeLevel: 2,
          },
        ],
      },
    },
  },
};

const CategoriesListOpenapi = {
  $path: 'get /catalog/categories',
  summary: 'Get list of categories',
  tags: ['Products'],
  description: 'Get all categories related to my products.',
  parameters: [
    {
      name: 'parentId',
      in: 'query',
      schema: {
        type: 'number',
      },
    },
    {
      name: 'treeNodeLevel',
      in: 'query',
      schema: {
        type: 'number',
      },
    },
  ],
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              count: {
                type: 'number',
              },
              categories: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Category',
                },
              },
            },
          },
          examples: {
            response: {
              value: {
                count: 123,
                categories: [
                  {
                    id: 4857,
                    name: {
                      tr: 'Ayakkabı',
                      en: 'Shoes',
                      ar: 'حذاء',
                    },
                    parentId: 455,
                    productsCount: 100,
                    treeNodeLevel: 1,
                  },
                ],
              },
            },
          },
        },
      },
    },
    401: { $ref: '#/components/responses/UnauthorizedErrorToken' },
  },
  security: [{ bearerAuth: [] as any[] }],
};

export const CategoriesOpenapi: ServiceSchema = {
  name: 'categories',
  settings: {
    openapi: CategoriesSettingsOpenapi,
  },
  actions: {
    list: { openapi: CategoriesListOpenapi },
  },
};
