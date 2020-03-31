import { Context, Errors, ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import DbService from '../utilities/mixins/mongo.mixin';
const MoleculerError = Errors.MoleculerError;

import { v1 as uuidv1, v4 as uuidv4 } from 'uuid';
import { StoresOpenapi } from '../utilities/mixins/openapi';
import { Log, OmsStore, Store, StoreUser, User } from '../utilities/types';
import { StoresValidation } from '../utilities/mixins/validation';
const { MoleculerClientError } = Errors;

const TheService: ServiceSchema = {
  name: 'stores',
  mixins: [DbService('stores'), StoresValidation, StoresOpenapi],
  settings: {
    /** Secret for JWT */
    JWT_SECRET: process.env.JWT_SECRET || 'jwt-conduit-secret',

    /** Public fields */
    fields: ['_id'],

    /** Validator schema for entity */
    entityValidator: {
      consumerKey: { type: 'string' },
      consumerSecret: { type: 'string' },
    },
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
        ttl: 60 * 60 * 24, // 1 day
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
      },
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
        ttl: 60 * 60 * 24, // 1 day
      },
      handler(ctx: Context) {
        return this.adapter
          .findOne({ consumer_key: ctx.meta.user })
          .then(async (res: Store | null) => {
            let omsData: boolean | { store: Store } = false;
            if (res) {
              if (res.users) {
                res.subscription = await ctx.call('subscription.get', { id: res._id });
              }
              if (res.internal_data && res.internal_data.omsId) {
                omsData = (await ctx.call('oms.getCustomer', {
                  customerId: res.internal_data.omsId,
                }).then(null, this.logger.error)) as { store: Store };
                // If the DB response not null will return the data
                return this.sanitizeResponse(res, omsData.store);
              }
            }
            // If null return Not Found error
            ctx.meta.$statusMessage = 'Not Found';
            ctx.meta.$statusCode = 404;
            return { errors: [{ message: 'Store Not Found' }] };
          });
      },
    },
    /**
     * Get store with it's url
     *
     * @param {string} id
     * @returns {Store}
     */
    sGet: {
      auth: 'Basic',
      cache: {
        keys: ['id'],
        ttl: 60 * 60 * 24, // 1 day
      },
      handler(ctx: Context) {
        return this.adapter.findById(ctx.params.id).then(async (res: Store | null) => {
          if (res) {
            if (res.users) {
              res.subscription = await ctx.call('subscription.get', { id: ctx.params.id });
            }
            if (res.internal_data && res.internal_data.omsId) {
              const omsData = (await ctx.call('oms.getCustomer', {
                customerId: res.internal_data.omsId,
              }).then(null, this.logger.error)) as { store: Store };

              // If the DB response not null will return the data
              if (!omsData) {
                this.logger.warn('Can not get balance', ctx.params);
              } else {
                return this.sanitizeResponse(res, omsData.store);
              }
            }
          }

          // return store even if we didn't get balance from OMS
          if (res) {
            return this.sanitizeResponse(res);
          }

          // If null return Not Found error
          ctx.meta.$statusMessage = 'Not Found';
          ctx.meta.$statusCode = 404;
          return { errors: [{ message: 'Store Not Found' }] };
        });
      },
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
        ttl: 60 * 60 * 24, // 1 day
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
          sort: params.sort,
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
      },
    },
    storesList: {
      auth: 'Basic',
      cache: {
        keys: ['id', 'page', 'perPage'],
        ttl: 60 * 60 * 24, // 1 day
      },
      handler(ctx: Context) {
        const query: any = {};
        if (ctx.params.id) {
          query._id = { $regex: new RegExp(`.*${ctx.params.id}.*`, 'i') };
        }
        const findBody: any = { query };
        findBody.limit = Number(ctx.params.perPage) || 50;
        findBody.offset = (Number(ctx.params.perPage) || 50) * ((Number(ctx.params.page) || 1) - 1);
        return this.adapter
          .find(findBody)
          .then(async (res: Store[]) => {
            return {
              stores: res.map(store => this.sanitizeResponse(store)),
              total: await ctx.call('stores.countStores', {  key: ctx.params.id, query }),
            };
          })
          .catch((err: any) => {
            if (err.name === 'MoleculerError') {
              throw new MoleculerError(err.message, err.code);
            }
            throw new MoleculerError(err, 500);
          });
      },
    },
    countStores: {
      cache: {
        keys: ['key'],
        ttl: 60 * 60 * 24, // 1 day
      },
      handler(ctx: Context) {
        return this.adapter.count({ query: ctx.params.query });
      },
    },
    /**
     * Create new store
     *
     * @param {Store} createValidation
     * @returns {Store}
     */
    create: {
      auth: 'Basic',
      async handler(ctx: Context) {
        // Clear cache
        this.broker.cacher.clean(`stores.sGet:${ctx.params.url}`);

        // FIX: Clear only cache by email
        this.broker.cacher.clean('stores.list:**');
        this.broker.cacher.clean('stores.storesList:**');
        this.broker.cacher.clean('stores.countStores:**');

        // Sanitize request params
        const store: Store = this.sanitizeStoreParams(ctx.params, true);

        // Initial response variable
        let error: {} = {};
        const myStore = await this.adapter
          .insert(store)
          .then((res: Store) => this.sanitizeResponse(res))
          .catch((err: { code: number }) => {
            this.logger.error('Create store', err);
            // Errors Handling
            ctx.meta.$statusMessage = 'Internal Server Error';
            ctx.meta.$statusCode = 500;

            error = {
              errors: [{ message: err.code === 11000 ? 'Duplicated entry!' : 'Internal Error!' }],
            };
          });

        // create in OMS
        this.createOmsStore(ctx.params)
          .then((response: { store: OmsStore }) => {
            const internal = myStore.internal_data;
            if (!response.store) throw response;
            internal.omsId = response.store && response.store.id;
            ctx.call('stores.update', {
              id: ctx.params.url,
              internal_data: internal,
            });
          })
          .catch((err: unknown) => {
            this.sendLogs({
              topic: 'store',
              topicId: ctx.params.url,
              message: 'Create in OMS',
              storeId: ctx.params.url,
              logLevel: 'error',
              code: 500,
              payload: { error: err, params: ctx.params },
            });
          });

        return myStore || error;
      },
    },
    /**
     * Update store
     *
     * @param {Store} updateValidation
     * @returns {Store}
     */
    update: {
      auth: 'Basic',
      async handler(ctx: Context) {
        // Save the ID separate into variable to use it to find the store
        const { id } = ctx.params;
        delete ctx.params.id;
        // storeBefore
        const storeBefore = this.adapter.findById(id);

        // If the store not found return Not Found error
        if (!storeBefore) {
          ctx.meta.$statusMessage = 'Not Found';
          ctx.meta.$statusCode = 404;
          return {
            errors: [{ message: 'Store Not Found' }],
          };
        }

        // Sanitize request params
        const store: Store = this.sanitizeStoreParams(ctx.params);

        // Check new values
        Object.keys(store).forEach((key: keyof Store) => {
          if (store[key] === storeBefore[key]) delete store[key];
        });

        // if no new updates
        if (Object.keys(store).length === 0) return storeBefore;

        const myStore: Store = await this.adapter
          .updateById(id, { $set: store })
          .then(async (res: Store) => {
            return this.sanitizeResponse(res);
          })
          .catch((error: { code: number }) => {
            this.sendLogs({
              topic: 'store',
              topicId: id,
              message: 'update Store',
              storeId: id,
              logLevel: 'error',
              code: 500,
              payload: { error, params: ctx.params },
            });
            ctx.meta.$statusMessage = 'Internal Server Error';
            ctx.meta.$statusCode = 500;

            return {
              errors: [{ message: error.code === 11000 ? 'Duplicated entry!' : 'Internal Error!' }],
            };
          });

        // Clean cache if store updated
        this.broker.cacher.clean(`stores.findInstance:${myStore.consumer_key}*`);
        this.broker.cacher.clean(`stores.findInstance:*${myStore.url}*`);
        this.broker.cacher.clean(`stores.me:${myStore.consumer_key}*`);
        this.broker.cacher.clean(`stores.sGet:${myStore.url}*`);
        this.broker.cacher.clean('stores.list**');
        this.broker.cacher.clean('stores.storesList:**');
        this.broker.cacher.clean(`products.list:${myStore.consumer_key}*`);
        this.broker.cacher.clean(`products.getInstanceProduct:${myStore.consumer_key}*`);

        if (myStore.internal_data && myStore.internal_data.omsId) {
          ctx.call('crm.updateStoreById', { id, ...ctx.params }).then(null, (error: unknown) => {
            this.sendLogs({
              topic: 'store',
              topicId: id,
              message: 'Update in OMS',
              storeId: id,
              logLevel: 'error',
              code: 500,
              payload: { error, params: ctx.params },
            });
          });
        } else {
          this.sendLogs({
            topic: 'store',
            topicId: id,
            message: 'Update in OMS, omsId not found',
            storeId: id,
            logLevel: 'error',
            code: 500,
            payload: { params: ctx.params },
          });
        }

        return myStore;
      },
    },
    sync: {
      auth: 'Basic',
      cache: {
        ttl: 60 * 60 * 3,
        keys: ['id', 'timestamp'],
      },
      async handler(ctx) {
        const storeId = ctx.params.id;
        const instance = await ctx.call('stores.findInstance', {
          id: storeId,
        });
        if (!instance.url) {
          ctx.meta.$statusCode = 404;
          ctx.meta.$statusMessage = 'Not Found!';
          return {
            errors: [
              {
                message: 'Store not found!',
              },
            ],
          };
        }
        try {
          const omsStore = await ctx.call('oms.getCustomerByUrl', { storeId }).then(
            response => response.store,
            err => {
              if (err.code !== 404) {
                throw new MoleculerError(err.message, err.code || 500);
              }
              if (err.code === 404) {
                return this.createOmsStore(instance).then((value: any) => {
                  return value;
                });
              }
            },
          );
          instance.internal_data = {
            ...instance.internal_data,
            omsId: omsStore.id || (omsStore.store && omsStore.store.id),
          };
          this.broker.cacher.clean(`orders.getOrder:${instance.consumer_key}*`);
          this.broker.cacher.clean(`orders.list:${instance.consumer_key}*`);
          this.broker.cacher.clean(`invoices.get:${instance.consumer_key}*`);
          this.broker.cacher.clean(`subscription.get:${instance.url}*`);
          return ctx.call('stores.update', {
            id: storeId,
            internal_data: instance.internal_data,
            updated: '2010-01-01T00:00:00.000Z',
            stock_date: '2010-01-01T00:00:00.000Z',
            price_date: '2010-01-01T00:00:00.000Z',
            stock_status: 'idle',
            price_status: 'idle',
          });
        } catch (err) {
          ctx.meta.$statusCode = err.status || (err.error && err.error.statusCode) || 500;
          ctx.meta.$statusMessage =
            err.statusText || (err.error && err.error.name) || 'Internal Error';
          return {
            errors: [
              {
                message: err.error ? err.error.message : 'Internal Server Error',
              },
            ],
          };
        }
      },
    },

    // login action

    /**
     * Login with consumerKey & consumerSecret
     *
     * @actions
     * @param {Object} user - User credentials
     *
     * @returns {Object} Logged in user with token
     */
    login: {
      handler(ctx: Context) {
        const { consumerKey, consumerSecret } = ctx.params;

        return this.Promise.resolve(
          this.broker.call('stores.findInstance', { consumerKey, consumerSecret }),
        )
          .then((instance: Store) => {
            if (
              consumerKey === instance.consumer_key &&
              consumerSecret === instance.consumer_secret
            ) {
              return {
                _id: instance.consumer_key,
                url: instance.url,
                status: instance.status,
                currency: instance.currency,
              };
            }
            this.broker.cacher.clean(`stores.findInstance:${ctx.params.consumerKey}`);

            ctx.meta.$statusCode = 401;
            ctx.meta.$statusMessage = 'Unauthorized Error';
            return {
              errors: [
                { field: 'consumerKey', message: 'is not valid' },
                { field: 'consumerSecret', message: 'is not valid' },
              ],
            };
          })
          .then((user: StoreUser) => this.transformEntity(user, true, ctx.meta.token))
          .catch(() => {
            this.broker.cacher.clean(`stores.resolveBearerToken:${ctx.meta.token}`);

            ctx.meta.$statusCode = 401;
            ctx.meta.$statusMessage = 'Unauthorized Error';
            return {
              errors: [
                { field: 'consumerKey', message: 'is not valid' },
                { field: 'consumerSecret', message: 'is not valid' },
              ],
            };
          });
      },
    },

    /**
     * Get user by JWT token (for API GW authentication)
     *
     * @actions
     * @param {String} token - JWT token
     *
     * @returns {Object} Resolved user
     */
    resolveBearerToken: {
      cache: {
        keys: ['token'],
        ttl: 60 * 60 * 24 * 30, // 1 hour
      },
      handler(ctx: Context) {
        return new this.Promise((resolve: any, reject: any) => {
          jwt.verify(
            ctx.params.token,
            this.settings.JWT_SECRET,
            (error: Error, decoded: object) => {
              if (error) {
                reject(false);
              }

              resolve(decoded);
            },
          );
        })
          .then(async (decoded: { id: any }) => {
            if (decoded.id) {
              // Get instance info
              const instance = await this.broker.call('stores.findInstance', {
                consumerKey: decoded.id,
              });
              if (instance.status) {
                return decoded;
              }
            }
          })
          .catch(() => {
            return false;
          });
      },
    },

    /**
     * Get user by JWT token (for API GW authentication)
     *
     * @actions
     * @param {String} token - user:pass base64
     *
     * @returns {Object} true or false
     */
    resolveBasicToken: {
      cache: {
        keys: ['token'],
        ttl: 60 * 60 * 24, // 1 day
      },
      handler(ctx: Context) {
        return fetch(`${process.env.AUTH_BASEURL}/login`, {
          headers: {
            Authorization: `Basic ${ctx.params.token}`,
          },
        })
          .then(res => {
            if (res.ok) {
              return res.json();
            }

            return false;
          })
          .catch(error => {
            throw new MoleculerClientError(error);
          });
      },
    },
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
            sort: 0,
          },
          {
            name: 'TNT',
            sort: 1,
          },
          {
            name: 'DHL',
            sort: 2,
          },
        ];
        if (!store.internal_data) store.internal_data = {};
      }
      if (params.users) {
        params.users = params.users.map((user: StoreUser) => ({
          email: user.email.toLowerCase(),
          roles: user.roles,
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
        'address',
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
    createOmsStore(params) {
      const body: OmsStore = {};

      params.users.forEach((user: User) => {
        // Backward compatibility since zoho require contact last
        if (!user.last_name) user.last_name = params.name;
      });

      // Sanitized params keys
      const keys: string[] = [
        'url',
        'name',
        'status',
        'type',
        'stock_status',
        'price_status',
        'sale_price',
        'sale_price_operator',
        'compared_at_price',
        'compared_at_price_operator',
        'currency',
        'users',
        'languages',
        'shipping_methods',
        'address',
      ];
      const transformObj: { [key: string]: string } = {
        type: 'platform',
        compared_at_price: 'comparedPrice',
        compared_at_price_operator: 'comparedOperator',
        stock_status: 'stockStatus',
        price_status: 'priceStatus',
        sale_price: 'salePrice',
        sale_price_operator: 'saleOperator',
        shipping_methods: 'shippingMethods',
        address: 'billing',
      };
      Object.keys(params).forEach(key => {
        if (!keys.includes(key)) return;
        const keyName: string = transformObj[key] || key;
        body[keyName] = params[key].$date || params[key];
      });
      // if no attributes no create
      if (Object.keys(body).length === 0) return;
      if (body.shippingMethods) {
        body.shippingMethods = (body.shippingMethods as Array<{ name: string }>).map(
          method => method.name,
        );
      }
      body.stockDate = params.stock_date;
      body.priceDate = params.price_date;
      return this.broker.call('oms.createCustomer', body);
    },
    /**
     * Log order errors
     *
     * @param {Log} log
     * @returns {ServiceSchema}
     */
    sendLogs(log: Log): ServiceSchema {
      log.topic = 'store';
      return this.broker.call('logs.add', log);
    },

    /**
     * Generate a JWT token from user entity
     *
     * @param {Object} user
     */
    generateJWT(user) {
      const today = new Date();
      const exp = new Date(today);
      exp.setDate(today.getDate() + 60);

      return jwt.sign(
        {
          id: user._id,
          consumerKey: user.consumerKey,
          exp: Math.floor(exp.getTime() / 1000),
        },
        this.settings.JWT_SECRET,
      );
    },

    /**
     * Transform returned user entity. Generate JWT token if necessary.
     *
     * @param {Object} user
     * @param {Boolean} withToken
     */
    transformEntity(user, withToken, token) {
      if (user) {
        if (withToken) {
          user.token = token || this.generateJWT(user);
        }
      }

      return { channel: user };
    },
  },
};

export = TheService;
