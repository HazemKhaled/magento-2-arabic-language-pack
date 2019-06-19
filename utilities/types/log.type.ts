/**
 * Log Type definition
 *
 * @export
 * @interface Log
 */
export interface Log {
  topic: string;
  topicId: string;
  '@timestamp': Date;
  logLevel: 'info' | 'debug' | 'warning' | 'error';
  storeId: string;
  message: string;
}
