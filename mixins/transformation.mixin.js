module.exports = {
  name: 'transformation',
  methods: {
    /**
     * Pick only language keys
     *
     * @param {Object} obj
     * @returns
     * @memberof ElasticLib
     */
    formatI18nText(obj) {
      if (!obj) return;

      const output = {};

      ['ar', 'en', 'tr', 'fr'].forEach(key => {
        if (obj[key] && key.length === 2) {
          output[key] = typeof obj[key] === 'string' ? obj[key] : obj[key].text;
        }
      });

      // Cleanup null values
      Object.keys(output).forEach(k => {
        if (!output[k]) delete output[k];
      });

      return Object.keys(output).length ? output : false;
    },
    /**
     * Format Variations
     *
     * @param {Array} variations
     * @param {Object} instance
     * @param {Number} rate
     * @returns {Array} Transformed Variations
     * @memberof ElasticLib
     */
    formatVariations(variations, instance, rate, archive, variationsInstance) {
      return variations.map((variation, n) => {
        const variant = {
          sku: variation.sku,
          cost_price: variation.sale * rate,
          sale_price:
            instance.salePriceOprator === 1
              ? variation.sale * instance.salePrice * rate
              : variation.sale * rate + instance.salePrice,
          market_price:
            instance.comparedAtPriceOprator === 1
              ? variation.sale * instance.comparedAtPrice * rate
              : variation.sale * rate + instance.comparedAtPrice,
          weight: variation.weight,
          attributes: this.formatAttributes(variation.attributes),
          quantity: archive ? 0 : variation.quantity
        };
        try {
          if (typeof variationsInstance[n].externalId !== 'undefined')
            variant.externalId = variationsInstance[n].externalId;
        } catch (err) {
          /** */
        }
        return variant;
      });
    },
    /**
     * Format Categories
     *
     * @param {Array} categories
     * @returns {Array} Categories
     * @memberof ElasticLib
     */
    formatCategories(categories) {
      return categories.map(category => ({
        id: category.odooId,
        name: this.formatI18nText(category.name_i18n)
      }));
    },

    /**
     * Format Attributes
     *
     * @param {Array} attributes
     * @returns {Array} Formatted Attributes
     * @memberof ElasticLib
     */
    formatAttributes(attributes) {
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
