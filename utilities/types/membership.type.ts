import { GenericObject } from 'moleculer';

import { I18n } from './i18ntext.type';

/**
 * Membership type
 *
 * @export
 * @interface Membership
 */
export interface Membership {
  _id: string;
  id: string;
  name: I18n;
  tagline: I18n;
  description: I18n;
  sort: number;
  active: boolean;
  public: boolean;
  cost: number;
  country: string;
  discount: number;
  paymentFrequency: number;
  paymentFrequencyType: 'month' | 'year';
  attributes: GenericObject;
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
}

/**
 * Membership Request Params definition
 *
 * @exports
 * @interface MembershipRequestParams
 */
export interface MembershipRequestParams extends Membership {
  _id: string;
  coupon: string;
}
