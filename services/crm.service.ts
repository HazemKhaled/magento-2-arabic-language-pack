import FormData from 'form-data';
import { Context, Errors, ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';
import { CrmStore, OrderAddress, Store } from '../utilities/types';
import { CrmValidation } from '../utilities/mixins/validation';
const MoleculerError = Errors.MoleculerError;

interface CrmData extends Store {
  last_order_date?: string;
  membership_id?: string;
  subscription_expiration?: string;
}

const TheService: ServiceSchema = {
  name: 'crm',
  mixins: [CrmValidation],
  settings: {
    accessToken: '',
  },
  actions: {
    refreshToken: {
      cache: false,
      handler(): Promise<object> {
        return this.request({
          method: 'post',
          isAccountsUrl: true,
          path: '/oauth/v2/token',
          body: {
            client_id: process.env.ZOHO_CLIENTT_ID,
            client_secret: process.env.ZOHO_CLIENT_SECRET,
            refresh_token: process.env.CRM_REFRESH_TOKEN,
            grant_type: 'refresh_token',
          },
          bodyType: 'formData',
        }).then((res: { access_token: string; error: string }) => {
          if (res.error) {
            throw this.errorFactory(res.error, 401);
          }
          this.settings.accessToken = res.access_token;
        });
      },
    },
    findStoreByUrl: {
      cache: {
        ttl: 60 * 60 * 24,
        keys: ['id'],
      },
      async handler(ctx: Context): Promise<object> {
        const res = await ctx.call('crm.findRecords', {
          module: 'accounts',
          criteria: `((Account_Name:equals:${ctx.params.id}))`,
        });

        if (!res.data[0]) {
          throw this.errorFactory('Store not found!', 404);
        }
        return res.data[0];
      },
    },
    updateStoreById: {
      async handler(ctx: Context): Promise<object> {
        const { id: crmStoreId } = await ctx.call('crm.findStoreByUrl', { id: ctx.params.id });

        return ctx.call('crm.updateRecord', {
          module: 'accounts',
          id: crmStoreId,
          data: [this.transformStoreParams(ctx.params)],
        });
      },
    },
    addTagsByUrl: {
      async handler(ctx: Context): Promise<object> {
        const { id, tag } = ctx.params;
        const { id: crmStoreId } = await ctx.call('crm.findStoreByUrl', { id });

        return ctx.call('crm.addTagsToRecord', {
          module: 'accounts',
          id: crmStoreId,
          tag,
        });
      },
    },
    createRecord: {
      handler(ctx: Context): Promise<object> {
        const { module, data } = ctx.params;

        return this.request({
          method: 'post',
          path: `/crm/v2/${module}`,
          bodyType: 'json',
          body: { data },
        });
      },
    },
    updateRecord: {
      handler(ctx: Context): Promise<object> {
        const { module, id, data } = ctx.params;

        return this.request({
          method: 'put',
          path: `/crm/v2/${module}/${id}`,
          bodyType: 'json',
          body: { data },
        });
      },
    },
    findRecords: {
      handler(ctx: Context): Promise<object> {
        const { module, criteria, email, phone, word } = ctx.params;

        return this.request({
          method: 'get',
          path: `/crm/v2/${module}/search`,
          params: { criteria, email, phone, word },
        });
      },
    },
    addTagsToRecord: {
      handler(ctx: Context): Promise<object> {
        const { module, id, tag } = ctx.params;

        return this.request({
          method: 'post',
          path: `/crm/v2/${module}/${id}/actions/add_tags`,
          params: { tag_names: tag },
        });
      },
    },
    removeTagsFromRecord: {
      handler(ctx: Context): Promise<object> {
        const { module, id, tag } = ctx.params;

        return this.request({
          method: 'post',
          path: `/crm/v2/${module}/${id}/actions/remove_tags`,
          params: { tag_names: tag },
        });
      },
    },
  },
  methods: {
    /**
     * General http requests methods for Zoho crm to handle variuos zoho requests
     * Also checks errors for auth and reauth if the token expired
     *
     * @param {({
     *             method: string,
     *             path: string,
     *             isAccountsUrl: boolean,
     *             body: {[key: string]: unknown},
     *             bodyType: 'json' | 'formData',
     *             params: {[key: string]: string}
     *         })} {method = 'get', path, isAccountsUrl = false, body, bodyType = 'json', params}
     * @returns Promise<fetchedData>
     */
    request({
      method = 'get',
      path,
      isAccountsUrl = false,
      body,
      bodyType = 'json',
      params,
    }: {
      method: string;
      path: string;
      isAccountsUrl: boolean;
      body: { [key: string]: unknown };
      bodyType: 'json' | 'formData';
      params: { [key: string]: string };
    }): Promise<object> {
      let url = process.env.ZOHO_CRM_URL;
      let queryString = '';
      const headers: { [key: string]: string } = {
        Authorization: `Bearer ${this.settings.accessToken}`,
      };
      if (isAccountsUrl) {
        url = process.env.ZOHO_ACCOUNTS_URL;
        delete headers.Authorization;
      }
      const fetchParams: any = {
        method,
      };
      if (body && bodyType === 'formData') {
        const bodyFormat = new FormData();
        Object.keys(body).forEach(key => bodyFormat.append(key, body[key]));
        fetchParams.body = bodyFormat;
      }
      if (body && bodyType === 'json') {
        fetchParams.body = JSON.stringify(body);
        headers['Content-Type'] = 'application/json';
      }
      if (params) {
        queryString = Object.keys(params).reduce(
          (accumulator, key) => params[key] ?`${accumulator}${accumulator ? '&' : '?'}${key}=${params[key]}` : accumulator,
          '',
        );
      }
      fetchParams.headers = headers;
      return fetch(`${url}${path}${queryString}`, fetchParams)
        .then(async res => {
          const parsedRes = await res.json();
          if (res.status === 401) {
            await this.broker.call('crm.refreshToken');
            return this.request({ method, path, isAccountsUrl, body, bodyType, params });
          }
          if (!res.ok && res.status !== 401) {
            throw this.errorFactory(parsedRes, res.status);
          }
          return parsedRes;
        })
        .catch(err => {
          throw this.errorFactory(err.message, err.code);
        });
    },
    transformStoreParams(params: CrmData): object {
      const newObj: { [key: string]: string } = {
        id: params.id,
      };
      const crmParams: { [key: string]: string } = {
        type: 'Platform',
        status: 'Store_Status',
        stock_date: 'Stock_Date',
        stock_status: 'Stock_Status',
        price_date: 'Price_Date',
        price_status: 'Price_Status',
        sale_price: 'Sale_Price',
        sale_price_operator: 'Sale_Operator',
        compared_at_price: 'Compared_Price',
        compared_at_price_operator: 'Compared_Operator',
        currency: 'Currency',
        languages: 'Languages',
        shipping_methods: 'Shipping_Methods',
        country: 'Billing_Country',
        city: 'Billing_City',
        state: 'Billing_State',
        postCode: 'Billing_Code',
        address_1: 'Billing_Street',
        first_name: 'Billing_Name',
        last_name: 'Billing_Name',
        phone: 'Billing_Phone',
        membership_id: 'Subscription_Name',
        subscription_expiration: 'Subscription_Expiration',
        last_order_date: 'Last_Order_Date',
      };
      Object.keys(params).forEach((key: keyof CrmData) => {
        if (typeof params[key] === 'string') {
          newObj[crmParams[key] as keyof CrmStore] = params[key] as string;
        }
        if (key === 'last_order_date' || key === 'subscription_expiration') {
          const date = new Date(params[key]);
          const year = date.getFullYear();
          const month = `${date.getMonth() > 8 ? '' : '0'}${date.getMonth() + 1}`;
          const day = `${date.getDate() > 9 ? '' : '0'}${date.getDate()}`;
          const time = `${date.toTimeString().slice(0, 8)}`;
          const timeZoneOffset = -date.getTimezoneOffset() / 60;
          const timeZone = `${timeZoneOffset < 0 ? '-' : '+'}${
            Math.abs(timeZoneOffset) > 9 ? '' : '0'
          }${Math.abs(timeZoneOffset)}:00`;

          newObj[crmParams[key] as keyof CrmStore] = `${year}-${month}-${day}T${time}${timeZone}`;
        }
        if (key === 'address') {
          Object.keys(params[key]).forEach(attr => {
            newObj[crmParams[attr] as keyof CrmStore] = params[key][attr as keyof OrderAddress];
          });
        }
      });
      if (params.languages) {
        newObj.Languages = params.languages.reduce(
          (accumulator: string, lang: string) =>
            `${accumulator ? accumulator + '-' : accumulator}${lang}`,
          '',
        );
      }
      if (params.shipping_methods) {
        newObj.Shipping_Methods = params.shipping_methods.reduce(
          (accumulator: string, method: { name: string }) =>
            `${accumulator ? accumulator + '-' : accumulator}${method.name}`,
          '',
        );
      }
      if (params.address && (params.address.first_name || params.address.last_name)) {
        newObj.Billing_Name = `${params.address.first_name} ${params.address.last_name}`;
      }
      return newObj;
    },
    errorFactory(msg, code) {
      const error = new MoleculerError(msg, code);
      error.name = 'CRM Service';
      return error;
    },
  },
};

export = TheService;
