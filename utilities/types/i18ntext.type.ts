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
  storeId?: string;
}

/**
 * Common Error interface
 *
 * @export
 * @interface CommonError
 */
export interface CommonError extends Error {
  body?: {
    error: {
      index?: string;
      reason?: string;
    };
    status?: number;
  };
  code?: number;
  statusCode?: number;
  msg?: string;
}

/**
 * Elastic Search Type
 *
 * @export
 * @interface ElasticSearchType
 */
export interface ElasticSearchType {
  index?: string;
  size?: number;
  type?: string;
  body?: {
    size?: number;
    query?: {
      nested?: {
        path?: string;
        query?: {
          bool?: {
            filter?: GenericObject;
          };
        };
      };
      bool?: {
        filter?: GenericObject;
        must_not?: GenericObject;
      };
    };
  };
}

export interface ElasticSearchResponse {
  hits: {
    total: {
      value: number;
    };
    hits: GenericObject[];
  };
  code?: number;
  count?: number;
}

export interface MongoQueryType {
  _id?: string;
  startDate?: {
    $lte?: Date;
  };
  endDate?: {
    $gte?: Date;
  };
  type?: string;
}
