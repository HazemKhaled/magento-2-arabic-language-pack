import { Errors, ServiceSchema } from 'moleculer';
import ESService, { SearchResponse } from 'moleculer-elasticsearch';

import { I18nService } from '../utilities/mixins/i18n.mixin';
import { Category } from '../utilities/types';

const { MoleculerClientError } = Errors;

const TheService: ServiceSchema = {
  name: 'categories',

  /**
   * Service metadata
   */
  metadata: {},
  mixins: [ESService, I18nService],

  /**
   * Service settings
   */
  settings: {
    elasticsearch: {
      host: `http://${process.env.ELASTIC_AUTH}@${process.env.ELASTIC_HOST}:${
        process.env.ELASTIC_PORT
      }`,
      apiVersion: process.env.ELASTIC_VERSION || '6.x'
    }
  },

  /**
   * Actions
   */
  actions: {
    /**
     * List All Categories
     *
     * @returns {Array} Categories
     */
    list: {
      openapi: {
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
            bearerAuth: []
          }
        ]
      },
      auth: 'Bearer',
      cache: {
        ttl: 60 * 60, // 1 hour
        keys: ['parentId', 'treeNodeLevel']
      },
      params: {
        parentId: [{ type: 'number', optional: true }, { type: 'string', optional: true }],
        treeNodeLevel: [{ type: 'number', optional: true }, { type: 'string', optional: true }]
      },
      async handler(ctx): Promise<Category[]> {
        const categories = await this.fetchCategories(ctx.params);
        if (categories.status === 'failed') {
          ctx.meta.$statusCode = 404;
          ctx.meta.$statusMessage = 'Not Found';
        }
        return categories;
      }
    }
  },
  methods: {
    /**
     * Get Categories from ElasticSearch
     *
     * @returns {Category[]}
     */
    fetchCategories(params = {}): Category[] {
      const query: any = {
        bool: { filter: [], should: [], must_not: { term: { productsCount: 0 } } }
      };
      if (Object.keys(params).length === 0) {
        query.bool.filter.push({
          term: { treeNodeLevel: 1 }
        });
      }
      if (params.parentId || params.parentId === 0)
        query.bool.should.push(
          { term: { parentId: params.parentId } },
          { term: { _id: params.parentId } }
        );
      if (params.treeNodeLevel) {
        query.bool.filter.push({
          terms: { treeNodeLevel: params.treeNodeLevel.split(',') }
        });
      }
      return this.broker
        .call('categories.search', {
          index: 'categories',
          type: '_doc',
          body: {
            size: 999,
            query
          }
        })
        .then((result: SearchResponse<Category>) => {
          if (result.hits.total === 0) {
            return {
              status: 'failed',
              message: 'There are no categories at the moment.'
            };
          }
          const response: any = {
            count: result.hits.total,
            categories: result.hits.hits
              .filter(cat => cat._id !== params.parentId)
              .map((param: { _id: string; _source: Category }) => {
                const category: Category = param._source;
                return {
                  id: Number(param._id),
                  name: this.formatI18nText(category.name),
                  parentId: category.parentId,
                  productsCount: category.productsCount,
                  treeNodeLevel: category.treeNodeLevel
                };
              })
          };
          if (params.parentId && params.parentId !== '0') {
            const parent = result.hits.hits.find(cat => cat._id === params.parentId);
            response.parent = {
              id: Number(parent._id),
              name: this.formatI18nText(parent._source.name),
              parentId: parent._source.parentId,
              productsCount: parent._source.productsCount,
              treeNodeLevel: parent._source.treeNodeLevel
            };
          }
          return response;
        })
        .catch((error: any) => new MoleculerClientError(error));
    }
  }
};

export = TheService;
