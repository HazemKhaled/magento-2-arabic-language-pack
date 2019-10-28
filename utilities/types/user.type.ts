import { Subscription } from ".";

/**
 * User
 *
 * @export
 * @interface User
 */
export interface User {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  country: string;
  contact_email: string;
  subscriptions: Subscription[];
}

