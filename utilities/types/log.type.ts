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
}
