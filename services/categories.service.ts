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
      }`
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
      auth: 'Bearer',
      cache: {
        ttl: 60 * 60 // 1 hour
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
      const query: any = { bool: { filter: [] } };
      if (Object.keys(params).length === 0) {
        query.bool.filter.push({
          term: { treeNodeLevel: 1 }
        });
      }
      if (params.parentId) query.bool.filter.push({ term: { parentId: params.parentId } });
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

          return result.hits.hits.map((param: { _id: string; _source: Category }) => {
            const category: Category = param._source;
            return {
              id: Number(param._id),
              name: this.formatI18nText(category.name),
              parentId: category.parentId,
              productsCount: category.productsCount,
              treeNodeLevel: category.treeNodeLevel
            };
          });
        })
        .catch((error: any) => new MoleculerClientError(error));
    }
  }
};

export = TheService;
