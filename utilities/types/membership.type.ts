import { I18n } from './i18ntext.type';

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
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Membership Request Params definition
 *
 * @exports
 * @interface MembershipRequestParams
 */
export interface MembershipRequestParams extends Membership {
  _id?: string;
  isDefault: boolean;
  coupon?: string;
}
