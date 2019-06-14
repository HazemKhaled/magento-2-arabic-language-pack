import { Context, ServiceSchema } from 'moleculer';
import DbService from '../utilities/mixins/mongo.mixin';

import { v1 as uuidv1, v4 as uuidv4 } from 'uuid';
import { Store } from '../utilities/types/store.type';
import { createValidation, updateValidation } from '../utilities/validations/stores.validate';

const TheService: ServiceSchema = {
  name: 'stores',
  mixins: [DbService('stores')],
  settings: {
    API_URL: process.env.STORES_URL,
    AUTH: Buffer.from(`${process.env.BASIC_USER}:${process.env.BASIC_PASS}`).toString('base64')
  },
  actions: {
    /**
     * This function is used locally by mp to get an instance with conumerKey
     *
     * @param {String} consumerKey
     * @returns {Store}
     */
    findInstance: {
      auth: 'Basic',
      cache: {
        keys: ['consumerKey'],
        ttl: 60 * 60 // 1 hour
      },
      params: {
        consumerKey: { type: 'string', convert: true }
      },
      handler(ctx: Context) {
        return this.adapter
          .findOne({ consumer_key: ctx.params.consumerKey })
          .then((res: Store | null) => {
            // If the DB response not null will return the data
            if (res !== null) this.sanitizeResponse(res);
            // If null return Not Found error
            ctx.meta.$statusMessage = 'Not Found';
            ctx.meta.$statusCode = 404;
            return { error: [{ message: 'Store Not Found' }] };
          });
      }
    },
    /**
     * Get the store for the authanticated token
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
        return this.adapter.findOne({ consumer_key: ctx.meta.user }).then((res: Store | null) => {
          // If the DB response not null will return the data
          if (res !== null) this.sanitizeResponse(res);
          // If null return Not Found error
          ctx.meta.$statusMessage = 'Not Found';
          ctx.meta.$statusCode = 404;
          return { error: [{ message: 'Store Not Found' }] };
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
      params: {
        id: { type: 'string' }
      },
      cache: {
        keys: ['id'],
        ttl: 60 * 60 // 1 hour
      },
      handler(ctx: Context) {
        return this.adapter.findById(ctx.params.id).then((res: Store | null) => {
          // If the DB response not null will return the data
          if (res !== null) this.sanitizeResponse(res);
          // If null return Not Found error
          ctx.meta.$statusMessage = 'Not Found';
          ctx.meta.$statusCode = 404;
          return { error: [{ message: 'Store Not Found' }] };
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
      params: {
        filter: { type: 'string' }
      },
      cache: {
        keys: ['filter'],
        ttl: 60 * 60 // 1 hour
      },
      handler(ctx: Context) {
        let params: { where?: {}; limit?: {} } = {};
        try {
          params = JSON.parse(ctx.params.filter);
        } catch (err) {
          return 'Inputs Error!';
        }
        if (params.limit && params.limit > 100) {
          params.limit = 100;
          this.logger.info('The maximum store respone limit is 100');
        }
        return this.adapter
          .find({
            query: params.where,
            limit: params.limit || 100
          })
          .then((res: Store[] | null) => {
            // If the DB response not null will return the data
            if (res !== null) return res.map(store => this.sanitizeResponse(store));
            // If null return Not Found error
            ctx.meta.$statusMessage = 'Not Found';
            ctx.meta.$statusCode = 404;
            return { error: [{ message: 'Store Not Found' }] };
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
        this.broker.cacher.clean(`stores.get:**`);
        this.broker.cacher.clean(`stores.list:**`);
        // Sanitize request params
        const store: Store = this.sanitizeStoreParams(ctx.params, true);
        // Intial response variable
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
        // Save the ID seprate into variable to use it to find the store
        const { id } = ctx.params;
        delete ctx.params.id;
        // Sanitize request params
        const store: Store = this.sanitizeStoreParams(ctx.params);
        // Intial response variable
        let mReq: { [key: string]: {} } = {};
        try {
          mReq = await this.adapter
            .updateById(id, { $set: store })
            .then((res: Store) => this.sanitizeResponse(res));
          // If the store not found return Not Found error
          if (mReq === null) {
            ctx.meta.$statusMessage = 'Not Found';
            ctx.meta.$statusCode = 404;
            mReq = {
              errors: [{ message: 'Store Not Found' }]
            };
          }
          // Clean cache if store updated
          if (mReq.consumer_key) {
            this.broker.cacher.clean(`stores.**`);
            this.broker.cacher.clean(`products.list:${mReq.consumer_key}**`);
            this.broker.cacher.clean(`products.getInstanceProduct:${mReq.consumer_key}**`);
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
      // Some intial data when creating store
      if (create) {
        store._id = params.url;
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
            name: 'Standerd',
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
    sanitizeResponse(store: Store) {
      store.url = store._id;
      delete store._id;
      return store;
    }
  }
};

export = TheService;
