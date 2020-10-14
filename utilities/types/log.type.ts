import { GenericObject } from 'moleculer';

import { MetaParams, I18nText } from './i18ntext.type';

/**
 * Log Type definition
 *
 * @export
 * @interface Log
 */
export interface Log {
  id: string;
  topic: string;
  topicId: string;
  '@timestamp': Date;
  logLevel: 'info' | 'debug' | 'warn' | 'error';
  storeId: string;
  message: string;
  index?: string;
  type?: string;
  body?: {
    topic?: string;
    topicId?: string;
    '@timestamp'?: Date;
    logLevel?: 'info' | 'debug' | 'warn' | 'error' | string;
    storeId?: string;
    message?: string;
    payload?: string;
    code?: number;
    size?: number;
    from?: number;
    query?: { [key: string]: GenericObject };
    sort?: { [key: string]: string };
  };
}

/**
 * Logs Request Params
 *
 * @export
 * @interface LogRequestParams
 */
export interface LogRequestParams {
  topic: string;
  message: string;
  logLevel: string;
  storeId: string;
  topicId: string;
  payload: any;
  code?: number;
  sort?: string;
  limit?: string;
  page?: string;
}

/**
 * Logs Meta Request Params
 *
 * @export
 * @interface LogMetaParams
 */
export interface LogMetaParams extends MetaParams {
  storeId: string;
}
