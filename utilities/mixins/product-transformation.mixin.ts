import { ServiceSchema } from 'moleculer';

import { Attribute, Category, Store, Variation } from '../types';
import { I18nService } from './i18n.mixin';

export const ProductTransformation: ServiceSchema = {
  name: 'transformation',
  mixins: [I18nService],
  methods: {
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
      if(categories) {
      return categories.map(category => ({
        id: category.id,
        name: this.formatI18nText(category.name || category.name_i18n),
        parentId: category.parentId,
        productsCount: category.productsCount,
        treeNodeLevel: category.treeNodeLevel
      }));}
      return [];
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
