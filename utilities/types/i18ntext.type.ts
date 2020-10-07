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

/**
 * MetaParams
 * @exports
 * @interface MetaParams
 */
export interface MetaParams {
  store: {
    internal_data?: {
      omsId?: string;
    };
    consumer_key?: string;
    url?: string;
  };
  $statusCode?: number;
  $statusMessage?: string;
  $responseType?: string;
  user?: any;
}
