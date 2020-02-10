/**
 * Currency type
 *
 * @type {Currency}
 */
export interface Currency {
  _id?: string;
  currencyCode?: string;
  rate: number;
  lastUpdate?: Date;
}
