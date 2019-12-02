export const CategoriesListOpenapi = {
  $path: 'get /catalog/categories',
  summary: 'Get list of categories',
  tags: ['Products'],
  description: 'Get all categories related to my products.',
  parameters: [
    {
      name: 'parentId',
      in: 'query',
      required: false,
      schema: {
        type: 'number'
      }
    },
    {
      name: 'treeNodeLevel',
      in: 'query',
      required: false,
      schema: {
        type: 'number'
      }
    }
  ],
  responses: {
    '200': {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              count: {
                type: 'number'
              },
              categories: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Category'
                }
              }
            }
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
                      ar: 'حذاء'
                    },
                    parentId: 455,
                    productsCount: 100,
                    treeNodeLevel: 1
                  }
                ]
              }
            }
          }
        }
      }
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorToken'
    }
  },
  security: [
    {
      bearerAuth: [] as any[]
    }
  ]
};
