import { Attribute, Category, I18nText, Store, Variation } from './types';

module.exports = {
  name: 'transformation',
  methods: {
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
    },
    /**
     * Format Variations
     *
     * @param {Variation[]} variations
     * @param {Store} instance
     * @param {number} rate
     * @param {boolean} archive
     * @param {Variation[]} variationsInstance Transformed Variations
     * @returns {Variation[]}
     */
    formatVariations(
      variations: Variation[],
      instance: Store,
      rate: number,
      archive: boolean,
      variationsInstance: Variation[]
    ): Variation[] {
      return variations.map((variation, n) => {
        const variant: Variation = {
          sku: variation.sku,
          cost_price: variation.sale * rate,
          sale_price:
            instance.sale_price_operator === 1
              ? variation.sale * instance.sale_price * rate
              : variation.sale * rate + instance.sale_price,
          market_price:
            instance.compared_at_price_operator === 1
              ? variation.sale * instance.compared_at_price * rate
              : variation.sale * rate + instance.compared_at_price,
          weight: variation.weight,
          attributes: this.formatAttributes(variation.attributes),
          quantity: archive ? 0 : variation.quantity
        };

        try {
          if (typeof variationsInstance[n].externalId !== 'undefined') {
            variant.externalId = variationsInstance[n].externalId;
          }
        } catch (err) {
          /** */
        }
        return variant;
      });
    },

    /**
     * Format Categories
     *
     * @param {Category[]} categories
     * @returns {Category[]}
     */
    formatCategories(categories: Category[]): Category[] {
      return categories.map(category => ({
        id: category.odooId,
        name: this.formatI18nText(category.name_i18n)
      }));
    },

    /**
     * Format Attributes
     *
     * @param {Attribute[]} attributes
     * @returns {Attribute[]}
     */
    formatAttributes(attributes: Attribute[]): object[] {
      return attributes.map(attribute => {
        if (attribute && typeof attribute.name === 'string') {
          return {
            id: attribute.id,
            name: {
              en: attribute.name
            },
            option: {
              en: attribute.option
            }
          };
        }

        return attribute;
      });
    }
  }
};
