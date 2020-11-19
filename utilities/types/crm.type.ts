import { String } from 'lodash';
import { GenericObject } from 'moleculer';

import { I18nText } from './i18ntext.type';

/**
 * CRM Response Type definition
 *
 * @export
 * @interface CrmResponse
 */
export interface CrmResponse {
  data: GenericObject;
  Owner: {
    name: string;
    id: string;
    email: string;
  };
  Email: string;
  $currency_symbol: string;
  Other_Phone: string;
  Mailing_State: string;
  Other_State: string;
  Other_Country: string;
  Last_Activity_Time: string;
  Department: string;
  $state: string;
  Unsubscribed_Mode: string;
  $process_flow: string;
  Assistant: string;
  Mailing_Country: string;
  id: string;
  $approved: string;
  Reporting_To: string;
  $approval: {
    delegate: boolean;
    approve: boolean;
    reject: boolean;
    resubmit: boolean;
  };
  Other_City: string;
  Created_Time: string;
  $editable: boolean;
  Home_Phone: string;
  Created_By: {
    name: string;
    id: string;
    email: string;
  };
  Secondary_Email: string;
  Description: string;
  Mailing_Zip: string;
  $review_process: {
    approve: boolean;
    reject: boolean;
    resubmit: boolean;
  };
  Twitter: string;
  Other_Zip: string;
  Mailing_Street: string;
  Salutation: string;
  First_Name: string;
  Full_Name: string;
  Asst_Phone: string;
  Record_Image: string;
  Modified_By: {
    name: string;
    id: string;
    email: string;
  };
  $review: string;
  Skype_ID: string;
  Phone: string;
  Account_Name: {
    name: string;
    id: string;
  };
  Email_Opt_Out: boolean;
  Modified_Time: string;
  Date_of_Birth: string;
  Mailing_City: string;
  Unsubscribed_Time: string;
  Title: string;
  Other_Street: string;
  Mobile: string;
  $orchestration: string;
  Last_Name: string;
  $in_merge: boolean;
  Lead_Source: string;
  Fax: string;
  $approval_state: string;
  details: {
    Modified_Time: string;
    Modified_By: {
      name: string;
      id: string;
    };
    Created_Time: string;
    id: string;
    Created_By: {
      name: string;
      id: string;
    };
  };
}
