import { ServiceSchema } from 'moleculer';

import { I18nText } from './../mixins/types';

export const I18nService: ServiceSchema = {
  name: 'i18n',
  methods: {
    /**
     * Pick only language keys
     *
     * @param {I18nText} obj
     * @returns {(I18nText | false)}
     */
    formatI18nText(obj: any): I18nText | false {
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
