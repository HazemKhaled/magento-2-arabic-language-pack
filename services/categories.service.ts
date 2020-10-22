import { Errors, ServiceSchema, GenericObject } from 'moleculer';
import ESService from 'moleculer-elasticsearch';

import { MpError } from '../utilities/adapters';
import {
  I18nService,
  CategoriesOpenapi,
  CategoriesValidation,
} from '../utilities/mixins';
import { Category, CommonError } from '../utilities/types';

const { MoleculerClientError } = Errors;

const TheService: ServiceSchema = {
  name: 'categories',

  mixins: [ESService, I18nService, CategoriesValidation, CategoriesOpenapi],

  /**
   * Service settings
   */
  settings: {
    elasticsearch: {
      host: process.env.ELASTIC_URL,
      httpAuth: process.env.ELASTIC_AUTH,
      apiVersion: process.env.ELASTIC_VERSION || '7.x',
    },
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
      auth: ['Basic', 'Bearer'],
      cache: {
        ttl: 60 * 60,
        keys: ['parentId', 'treeNodeLevel'],
      },
      async handler(ctx): Promise<Category[]> {
        const categories = await this.fetchCategories(ctx.params);
        if (categories.status === 'failed') {
          throw new MpError('Categories Service', 'Not Found', 404);
        }
        return categories;
      },
    },
  },
  methods: {
    /**
     * Get Categories from ElasticSearch
     *
     * @returns {Category[]}
     */
    fetchCategories(params = {}): Category[] {
      const query: GenericObject = {
        bool: {
          filter: [],
          should: [],
          must_not: { term: { productsCount: 0 } },
        },
      };
      if (Object.keys(params).length === 0) {
        query.bool.filter.push({
          term: { treeNodeLevel: 1 },
        });
      }
      if (params.parentId || params.parentId === 0)
        query.bool.should.push(
          { term: { parentId: params.parentId } },
          { term: { _id: params.parentId } }
        );
      if (params.treeNodeLevel) {
        query.bool.filter.push({
          terms: { treeNodeLevel: params.treeNodeLevel.split(',') },
        });
      }
      return this.broker
        .call('categories.search', {
          index: 'categories',
          body: {
            size: 999,
            query,
          },
        })
        .then(
          (result: {
            hits: {
              total: { value: number };
              hits: { _id: string; _source: Category }[];
            };
          }) => {
            if (result.hits.total.value === 0) {
              return {
                status: 'failed',
                message: 'There are no categories at the moment.',
              };
            }
            const response: GenericObject = {
              count: result.hits.total.value,
              categories: result.hits.hits
                .filter(cat => cat._id !== params.parentId)
                .map((param: { _id: string; _source: Category }) => {
                  const category: Category = param._source;
                  return {
                    id: Number(param._id),
                    name: this.formatI18nText(category.name),
                    parentId: category.parentId,
                    productsCount: category.productsCount,
                    treeNodeLevel: category.treeNodeLevel,
                  };
                }),
            };
            if (params.parentId && params.parentId !== '0') {
              const parent = result.hits.hits.find(
                cat => cat._id === params.parentId
              );
              response.parent = {
                id: Number(parent._id),
                name: this.formatI18nText(parent._source.name),
                parentId: parent._source.parentId,
                productsCount: parent._source.productsCount,
                treeNodeLevel: parent._source.treeNodeLevel,
              };
            }
            return response;
          }
        )
        .catch((error: CommonError) => new MoleculerClientError(String(error)));
    },
  },
};

export = TheService;
