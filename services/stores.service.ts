import { Context, ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';
import DbService from '../utilities/mixins/mongo.mixin';

import { v1 as uuidv1, v4 as uuidv4 } from 'uuid';
import { ResError, Store, StoreUser } from '../utilities/types';
import { createValidation, updateValidation } from '../utilities/validations/stores.validate';

const TheService: ServiceSchema = {
  name: 'stores',
  mixins: [DbService('stores')],
  settings: {
    AUTH: Buffer.from(`${process.env.BASIC_USER}:${process.env.BASIC_PASS}`).toString('base64')
  },
  actions: {
    /**
     * This function is used locally by mp to get an instance with consumerKey
     *
     * @param {String} consumerKey
     * @returns {Store}
     */
    findInstance: {
      auth: 'Basic',
      cache: {
        keys: ['consumerKey', 'id'],
        ttl: 60 * 60 // 1 hour
      },
      params: {
        consumerKey: { type: 'string', convert: true, optional: true },
        id: { type: 'string', convert: true, optional: true }
      },
      handler(ctx: Context) {
        let query: { _id?: string } | false = false;
        if (ctx.params.id) query = { _id: ctx.params.id };
        return this.adapter
          .findOne(query || { consumer_key: ctx.params.consumerKey })
          .then((res: Store | null) => {
            // If the DB response not null will return the data
            if (res !== null) return this.sanitizeResponse(res);
            // If null return Not Found error
            ctx.meta.$statusMessage = 'Not Found';
            ctx.meta.$statusCode = 404;
            return { errors: [{ message: 'Store Not Found' }] };
          });
      }
    },
    /**
     * Get the store for the authenticated token
     *
     * @param {}
     * @returns {Store}
     */
    me: {
      auth: 'Bearer',
      cache: {
        keys: ['#user'],
        ttl: 60 * 60 // 1 hour
      },
      handler(ctx: Context) {
        return this.adapter
          .findOne({ consumer_key: ctx.meta.user })
          .then(async (res: Store | null) => {
            let omsData = false;
            if (res.internal_data && res.internal_data.omsId) {
              omsData = await fetch(
                `${process.env.OMS_BASEURL}/stores/${res.internal_data.omsId}`,
                {
                  method: 'get',
                  headers: {
                    Authorization: `Basic ${this.settings.AUTH}`
                  }
                }
              ).then(response => response.json());
            }
            this.logger.info(omsData);
            // If the DB response not null will return the data
            if (res !== null) return this.sanitizeResponse(res, omsData);
            // If null return Not Found error
            ctx.meta.$statusMessage = 'Not Found';
            ctx.meta.$statusCode = 404;
            return { errors: [{ message: 'Store Not Found' }] };
          });
      }
    },
    /**
     * Get store with it's url
     *
     * @param {string} id
     * @returns {Store}
     */
    get: {
      auth: 'Basic',
      cache: {
        keys: ['id'],
        ttl: 60 * 60 // 1 hour
      },
      params: {
        id: { type: 'string' }
      },
      handler(ctx: Context) {
        return this.adapter.findById(ctx.params.id).then(async (res: Store | null) => {
          let omsData = false;
          if (res && res.internal_data && res.internal_data.omsId) {
            omsData = await fetch(`${process.env.OMS_BASEURL}/stores/${res.internal_data.omsId}`, {
              method: 'get',
              headers: {
                Authorization: `Basic ${this.settings.AUTH}`
              }
            }).then(response => response.json());
          }
          // If the DB response not null will return the data
          if (res !== null) return this.sanitizeResponse(res, omsData);
          // If null return Not Found error
          ctx.meta.$statusMessage = 'Not Found';
          ctx.meta.$statusCode = 404;
          return { errors: [{ message: 'Store Not Found' }] };
        });
      }
    },
    /**
     * Search in stores for stores that matches the filter query
     *
     * @param {Object} filter
     * @returns {Store[]}
     */
    list: {
      auth: 'Basic',
      cache: {
        keys: ['filter'],
        ttl: 60 * 60 // 1 hour
      },
      params: {
        filter: { type: 'string' }
      },
      handler(ctx: Context) {
        let params: { where?: {}; limit?: {}; order?: string; sort?: {} } = {};
        try {
          params = JSON.parse(ctx.params.filter);
        } catch (err) {
          return 'Inputs Error!';
        }
        if (params.limit && params.limit > 100) {
          params.limit = 100;
          this.logger.info('The maximum store response limit is 100');
        }
        const query = {
          query: { ...params.where } || {},
          limit: params.limit || 100,
          sort: params.sort
        };
        if (params.order) {
          const sortArray = params.order.split(' ');
          if (sortArray.length === 2 && ['asc', 'desc'].includes(sortArray[1].toLowerCase())) {
            query.sort = { [sortArray[0]]: sortArray[1] === 'asc' ? 1 : -1 };
          }
        }
        return this.adapter.find({ ...query }).then((res: Store[] | null) => {
          // If the DB response not null will return the data
          if (res !== null) return res.map(store => this.sanitizeResponse(store));
          // If null return Not Found error
          ctx.meta.$statusMessage = 'Not Found';
          ctx.meta.$statusCode = 404;
          return { errors: [{ message: 'Store Not Found' }] };
        });
      }
    },
    /**
     * Create new store
     *
     * @param {Store} createValidation
     * @returns {Store}
     */
    create: {
      auth: 'Basic',
      params: createValidation,
      async handler(ctx: Context) {
        // Clear cache
        this.broker.cacher.clean(`stores.get:${ctx.params.url}`);

        // FIX: Clear only cache by email
        this.broker.cacher.clean(`stores.list:**`);

        // Sanitize request params
        const store: Store = this.sanitizeStoreParams(ctx.params, true);

        // Initial response variable
        let mReq: Store | {} = {};
        try {
          mReq = await this.adapter.insert(store).then((res: Store) => this.sanitizeResponse(res));
        } catch (err) {
          // Errors Handling
          ctx.meta.$statusMessage = 'Internal Server Error';
          ctx.meta.$statusCode = 500;
          mReq = {
            errors: [{ message: err.code === 11000 ? 'Duplicated entry!' : 'Internal Error!' }]
          };
        }
        return mReq;
      }
    },
    /**
     * Update store
     *
     * @param {Store} updateValidation
     * @returns {Store}
     */
    update: {
      auth: 'Basic',
      params: updateValidation,
      async handler(ctx: Context) {
        // Save the ID separate into variable to use it to find the store
        const { id } = ctx.params;
        delete ctx.params.id;
        // Sanitize request params
        const store: Store = this.sanitizeStoreParams(ctx.params);
        // Initial response variable
        let mReq: Store | ResError = { errors: [] };
        try {
          mReq = await this.adapter.updateById(id, { $set: store }).then(async (res: Store) => {
            this.updateOmsStore(res.internal_data.omsId, ctx.params);
            return this.sanitizeResponse(res);
          });
          // If the store not found return Not Found error
          if (mReq === null) {
            ctx.meta.$statusMessage = 'Not Found';
            ctx.meta.$statusCode = 404;
            mReq = {
              errors: [{ message: 'Store Not Found' }]
            };
          }
          const isResError = (req: Store | ResError): req is ResError =>
            (req as ResError).errors !== undefined;
          // Clean cache if store updated
          if (!isResError(mReq)) {
            this.broker.cacher.clean(`stores.findInstance:${mReq.consumer_key}*`);
            this.broker.cacher.clean(`stores.findInstance:*${mReq.url}*`);
            this.broker.cacher.clean(`stores.me:${mReq.consumer_key}*`);
            this.broker.cacher.clean(`stores.get:${mReq.url}*`);
            this.broker.cacher.clean(`stores.list**`);
            this.broker.cacher.clean(`products.list:${mReq.consumer_key}*`);
            this.broker.cacher.clean(`products.getInstanceProduct:${mReq.consumer_key}*`);
          }
        } catch (err) {
          ctx.meta.$statusMessage = 'Internal Server Error';
          ctx.meta.$statusCode = 500;
          mReq = {
            errors: [{ message: 'Internal Error' }]
          };
        }
        return mReq;
      }
    },
    sync: {
      auth: 'Basic',
      params: {
        id: { type: 'string' }
      },
      async handler(ctx) {
        const storeId = ctx.params.id;
        const instance = await ctx.call('stores.findInstance', {
          id: storeId
        });
        if (!instance.url) {
          ctx.meta.$statusCode = 404;
          ctx.meta.$statusMessage = 'Not Found!';
          return {
            errors: [
              {
                message: 'Store not found!'
              }
            ]
          };
        }
        try {
          const omsStore = await fetch(
            `${process.env.OMS_BASEURL}/stores?url=${encodeURIComponent(storeId)}`,
            {
              method: 'get',
              headers: {
                Authorization: `Basic ${this.settings.AUTH}`
              }
            }
          ).then(async res => {
            const response = await res.json();
            if (!res.ok && res.status !== 404) {
              response.status = res.status;
              response.statusText = res.statusText;
              throw response;
            }
            if (!res.ok && res.status === 404) {
              return fetch(`${process.env.OMS_BASEURL}/stores`, {
                method: 'post',
                headers: {
                  Authorization: `Basic ${this.settings.AUTH}`,
                  'Content-Type': 'application/json',
                  Accept: 'application/json'
                },
                body: JSON.stringify({
                  url: instance.url,
                  users: instance.users,
                  status: instance.status,
                  stockDate: instance.status_date,
                  stockStatus: instance.stock_status,
                  priceDate: instance.price_date,
                  priceStatus: instance.price_status,
                  salePrice: instance.sale_price,
                  saleOperator: instance.sale_price_operator,
                  comparedPrice: instance.compared_at_price,
                  comparedOperator: instance.compared_at_price_operator,
                  currency: [instance.currency],
                  shippingMethods: instance.shipping_methods.map(
                    (method: { name: string }) => method.name
                  ),
                  languages: instance.languages,
                  platform: instance.type,
                  companyName: instance.name
                })
              }).then(createRes => createRes.json());
            }
            this.logger.info(response);
            return response;
          });
          instance.internal_data = { ...instance.internal_data, omsId: omsStore.id };
          this.broker.cacher.clean(`orders.getOrder:${instance.consumer_key}*`);
          this.broker.cacher.clean(`orders.list:${instance.consumer_key}*`);
          this.broker.cacher.clean(`invoices.get:${instance.consumer_key}*`);
          return ctx.call('stores.update', {
            id: storeId,
            internal_data: instance.internal_data,
            updated: '2010-01-01T00:00:00.000Z',
            stock_date: '2010-01-01T00:00:00.000Z',
            price_date: '2010-01-01T00:00:00.000Z',
            stock_status: 'idle',
            price_status: 'idle'
          });
        } catch (err) {
          ctx.meta.$statusCode = err.status || (err.error && err.error.statusCode) || 500;
          ctx.meta.$statusMessage =
            err.statusText || (err.error && err.error.name) || 'Internal Error';
          return {
            errors: [
              {
                message: err.error ? err.error.message : 'Internal Server Error'
              }
            ]
          };
        }
      }
    }
  },
  methods: {
    /**
     * Sanitizing the store params before saving it to DB
     *
     * @param {Store} params
     * @param {boolean} [create=false]
     * @returns
     */
    sanitizeStoreParams(params, create = false) {
      const store: Store | any = {};
      // Some initial data when creating store
      if (create) {
        store._id = params.url.toLowerCase();
        store.consumer_key = uuidv1();
        store.consumer_secret = uuidv4();
        store.created = new Date();
        store.updated = new Date();
        store.stock_date = new Date();
        store.stock_status = 'idle';
        store.price_date = new Date();
        store.price_status = 'idle';
        store.sale_price = 1.7;
        store.sale_price_operator = 1;
        store.compared_at_price = 1.7;
        store.compared_at_price_operator = 1;
        store.currency = 'USD';
        store.shipping_methods = [
          {
            name: 'Standard',
            sort: 0
          },
          {
            name: 'TNT',
            sort: 1
          },
          {
            name: 'DHL',
            sort: 2
          }
        ];
      }
      if (params.users) {
        params.users = params.users.map((user: StoreUser) => ({
          email: user.email.toLowerCase(),
          roles: user.roles
        }));
      }
      // Sanitized params keys
      const keys = [
        'name',
        'status',
        'type',
        'updated',
        'stock_date',
        'stock_status',
        'price_date',
        'price_status',
        'sale_price',
        'sale_price_operator',
        'compared_at_price',
        'compared_at_price_operator',
        'currency',
        'external_data',
        'internal_data',
        'users',
        'languages',
        'shipping_methods',
        'logs',
        'address'
      ];
      Object.keys(params).forEach(key => {
        if (!keys.includes(key)) return;
        store[key] = params[key];
      });
      return store;
    },
    /**
     * Sanitize store delete _id add url
     *
     * @param {Store} store
     * @returns {Store}
     */
    sanitizeResponse(store: Store, omsData = false) {
      store.url = store._id;
      delete store._id;
      if (omsData) {
        store.debit = omsData.debit;
        store.credit = omsData.credit;
      }
      return store;
    },
    updateOmsStore(storeId, params) {
      const body: { [key: string]: string | StoreUser[] | string[]; users?: StoreUser[] } = {};
      // Sanitized params keys
      const keys: string[] = [
        'name',
        'status',
        'type',
        'stock_date',
        'stock_status',
        'price_date',
        'price_status',
        'sale_price',
        'sale_price_operator',
        'compared_at_price',
        'compared_at_price_operator',
        'currency',
        'users',
        'languages',
        'shipping_methods'
      ];
      const transformObj: { [key: string]: string } = {
        type: 'platform',
        compared_at_price: 'comparedPrice',
        compared_at_price_operator: 'comparedOperator',
        stock_date: 'stockDate',
        stock_status: 'stockStatus',
        price_date: 'priceDate',
        price_status: 'priceStatus',
        sale_price: 'salePrice',
        sale_price_operator: 'saleOperator'
      };
      Object.keys(params).forEach(key => {
        if (!keys.includes(key)) return;
        const keyName: string = transformObj[key] || key;
        body[keyName] = params[key].$date || params[key];
      });
      this.logger.info(body);
      if (Object.keys(body).length === 0) return;
      return fetch(`${process.env.OMS_BASEURL}/stores/${storeId}`, {
        method: 'put',
        headers: {
          Authorization: `Basic ${this.settings.AUTH}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(body)
      });
    }
  }
};

export = TheService;
