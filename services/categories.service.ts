import { Errors, ServiceSchema } from 'moleculer';
import ESService, { SearchResponse } from 'moleculer-elasticsearch';

import { I18nService } from './../mixins/i18n.mixin';
import { Category, I18nText } from './../mixins/types';

const { MoleculerClientError } = Errors;

export const CategoriesService: ServiceSchema = {
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
      handler() {
        return this.fetchCategories();
      }
    }
  },
  methods: {
    /**
     * Get Categories from ElasticSearch
     *
     * @returns {Category[]}
     */
    fetchCategories(): Category[] {
      return this.broker
        .call('categories.search', {
          index: 'categories',
          type: 'Category',
          body: {
            size: 999
          }
        })
        .then((result: SearchResponse<Category>) => {
          if (result.hits.total === 0) {
            return {
              status: 'failed',
              message: 'There are no categories at the moment.'
            };
          }

          return result.hits.hits.map((param: { _source: Category }) => {
            const category: Category = param._source;
            return {
              id: category.odooId,
              name: this.formatI18nText(category.name)
            };
          });
        })
        .catch((error: any) => new MoleculerClientError(error));
    }
  }
};
