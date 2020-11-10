import { GenericObject } from 'moleculer';

/**
 * I18nText Type definition
 *
 * @export
 * @interface I18nText
 */
export interface I18nText {
  [key: string]: { text: string };
}

/**
 * I18n Type
 */
export interface I18n {
  tr: string;
  en: string;
  ar: string;
}

export interface ElasticQuery {
  bool: {
    filter: {
      term?: GenericObject;
    }[];
    must: must[];
    must_not: must[];
  };
}

interface must {
  term?: GenericObject;
  exists?: GenericObject;
  range?: GenericObject;
}
