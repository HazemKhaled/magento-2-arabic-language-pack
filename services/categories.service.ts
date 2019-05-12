import { Errors, ServiceSchema } from 'moleculer';
import ESService, { SearchResponse } from 'moleculer-elasticsearch';

import { Category, I18nText } from './../mixins/types';

const { MoleculerClientError } = Errors;

export const CategoryService: ServiceSchema = {
  name: 'categories',

  /**
   * Service metadata
   */
  metadata: {},
  mixins: [ESService],

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
    },
    /**
     * Pick only language keys
     *
     * @param {I18nText} obj
     * @returns {(I18nText | false)}
     */
    formatI18nText(obj: I18nText): I18nText | false {
      if (!obj) {
        return;
      }

      const output: I18nText = {};

      ['ar', 'en', 'tr', 'fr'].forEach(key => {
        if (obj[key] && key.length === 2) {
          output[key] = typeof obj[key] === 'string' ? obj[key] : obj[key].text;
        }
      });

      // Cleanup null values
      Object.keys(output).forEach(k => {
        if (!output[k]) {
          delete output[k];
        }
      });

      return Object.keys(output).length ? output : false;
    }
  }
};
