import { I18n } from '.';

/**
 * Membership type
 *
 * @export
 * @interface Membership
 */
export interface Membership {
  id: string;
  name: I18n;
  tagline: I18n;
  description: I18n;
  sort: number;
  active: boolean;
  public: boolean;
  cost: number;
  country?: string;
  discount: number;
  paymentFrequency: number;
  paymentFrequencyType: 'month' | 'year';
  attributes: { [key: string]: any };
}
