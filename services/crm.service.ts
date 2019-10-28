import FormData from 'form-data';
import { Context, Errors , ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';
import { UpdateCrmStoreValidation } from '../utilities/validations';
const MoleculerError = Errors.MoleculerError;

const TheService: ServiceSchema = {
    name: 'crm',
    settings: {
        accessToken: ''
    },
    actions: {
        refreshToken: {
            cache: false,
            handler() {
                return this.request({
                    method: 'post',
                    isAccountsUrl: true,
                    path: 'oauth/v2/token',
                    body: {
                        client_id: process.env.ZOHO_CLIENTT_ID,
                        client_secret: process.env.ZOHO_CLIENT_SECRET,
                        refresh_token: process.env.CRM_REFRESH_TOKEN,
                        grant_type: 'refresh_token'
                    },
                    bodyType: 'formData',
                }).then((res: {access_token: string, error: string}) => {
                    if(res.error) {
                        throw new MoleculerError(res.error, 401)
                    }
                    this.settings.accessToken = res.access_token;
                });
            }
        },
        findStoreByUrl: {
            cache:  false,
            params: {
                id: { type: 'string' }
            },
            handler(ctx: Context) {
                return this.request({
                    path: 'crm/v2/accounts/search',
                    params: {
                        criteria: `((Account_Name:equals:${ctx.params.id}))`
                    }
                }).then((res: any) => {
                    if (!res.data[0]) {
                        throw new MoleculerError('Store Not Found', 404);
                    }
                    return res.data[0];
                });
            }
        },
        updateStoreById: {
            params: UpdateCrmStoreValidation,
            async handler(ctx: Context) {
                const crmStore = await ctx.call('crm.findStoreByUrl', {id: ctx.params.id});
                ctx.params.id = crmStore.id;
                return this.request({
                    method: 'put',
                    path: 'crm/v2/accounts',
                    bodyType: 'json',
                    body: {data: [this.transformStoreParams(ctx.params)]}
                });
            }
        },
        addTagsByUrl: {
            params: {
                id: { type: 'string' },
                tag: { type: 'string' }
            },
            async handler(ctx: Context) {
                const crmStore = await ctx.call('crm.findStoreByUrl', {id: ctx.params.id});
                return this.request({
                    method: 'post',
                    path: `crm/v2/accounts/${crmStore.id}/actions/add_tags`,
                    params: {
                        tag_names: ctx.params.tag
                    }
                });
            }
        }
    },
    methods: {
        request({method = 'get', path, isAccountsUrl = false, body, bodyType = 'json', params}: {
            method: string,
            path: string,
            isAccountsUrl: boolean,
            body: {[key: string]: unknown},
            bodyType: 'json' | 'formData',
            params: {[key: string]: string}
        }) {
            let url = process.env.ZOHO_CRM_URL;
            let queryString = '';
            const headers: {[key: string]: string} = {
                Authorization: `Bearer ${this.settings.accessToken}`
            }
            if(isAccountsUrl) {
                url = process.env.ZOHO_ACCOUNTS_URL;
                delete headers.Authorization;
            }
            const fetchParams: any = {
                method,
            }
            if(body && bodyType === 'formData') {
                const bodyFormat = new FormData();
                Object.keys(body).forEach(key => bodyFormat.append(key, body[key]));
                fetchParams.body = bodyFormat;
            }
            if(body && bodyType === 'json') {
                fetchParams.body = JSON.stringify(body);
                headers['Content-Type'] = 'application/json';
            }
            if(params) {
                queryString = Object.keys(params).reduce((accumulator, key) =>  `${accumulator ? '&' : '?'}${key}=${params[key]}`, '');
            }
            fetchParams.headers = headers;
            return fetch(`${url}/${path}${queryString}`, fetchParams).then(async res => {
                const parsedRes = await res.json();
                if(res.status === 401) {
                    await this.broker.call('crm.refreshToken');
                    return this.request({method, path, isAccountsUrl, body, bodyType, params});
                }
                if(!res.ok && res.status !== 401) {
                    throw new MoleculerError(parsedRes, res.status);
                }
                return parsedRes;
            }).catch(err => {throw new MoleculerError(err.message, err.code)});
        },
        transformStoreParams(params: any) {
            const newObj: any = {
                id: params.id
            };
            const crmParams: {[key: string]: string} = {
                type: 'Platform',
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
            };
            Object.keys(params).forEach(key => {
                if(typeof params[key] === 'string'){
                    newObj[crmParams[key]] = params[key];
                }
                if(key === 'address') {
                    Object.keys(params[key]).forEach(attr => {
                        newObj[crmParams[attr]] = params[key][attr];
                    })
                }
            });
            if(params.languages) {
                newObj.languages = params.languages.reduce((accumulator: string, lang: string) => `${accumulator ? accumulator + '-' : accumulator}${lang}`, '');
            }
            if(params.shipping_methods) {
                newObj.shipping_methods = params.shipping_methods.reduce((accumulator: string, method: {name: string}) => `${accumulator ? accumulator + '-' : accumulator}${method.name}`, '');
            }
            if(params.address && (params.address.first_name || params.address.last_name)) {
                newObj.name = `${params.address.first_name}${params.address.last_name}`;
            }
            return newObj;
        }
    }
}

export = TheService;
