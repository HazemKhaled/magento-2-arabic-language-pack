import { Context, Errors, ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { v1 as uuidv1, v4 as uuidv4 } from 'uuid';

import DbService from '../utilities/mixins/mongo.mixin';
import { MpError } from '../utilities/adapters';
import { StoresOpenapi } from '../utilities/mixins/openapi';
import { Oms } from '../utilities/mixins/oms.mixin';
import { Log, Store, StoreUser } from '../utilities/types';
import { StoresValidation } from '../utilities/mixins/validation';
import { GCPPubSub } from '../utilities/mixins';

const MoleculerError = Errors.MoleculerError;
const { MoleculerClientError } = Errors;

const TheService: ServiceSchema = {
  name: 'stores',
  mixins: [
    DbService('stores'),
    StoresValidation,
    StoresOpenapi,
    GCPPubSub,
    Oms,
  ],
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
  events: {
    'stores.event': function ({ event, storeId, res }): void {
      this.publishMessage(event, {
        storeId,
        data: {
          store: res,
        },
      });
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
      auth: ['Basic'],
      cache: {
        keys: ['consumerKey', 'id'],
        ttl: 60 * 60 * 24,
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
            throw new MpError('Stores Service', 'Store Not Found', 404);
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
      auth: ['Bearer'],
      cache: {
        keys: ['#user'],
        ttl: 60 * 60 * 24,
      },
      handler(ctx: Context) {
        return this.adapter
          .findOne({ consumer_key: ctx.meta.user })
          .then(async (res: Store | null) => {
            let omsData: boolean | { store: Store } = false;
            if (res) {
              if (res.users) {
                res.subscription = await ctx.call('subscription.sGet', {
                  id: res._id,
                });
              }
              if (res.internal_data && res.internal_data.omsId) {
                omsData = (await ctx
                  .call('oms.getCustomer', {
                    customerId: res.internal_data.omsId,
                  })
                  .then(null, this.logger.error)) as { store: Store };
                // If the DB response not null will return the data
                return this.sanitizeResponse(res, omsData && omsData.store);
              }
              return this.sanitizeResponse(res);
            }
            // If null return Not Found error
            throw new MpError('Stores Service', 'Store Not Found', 404);
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
      auth: ['Basic'],
      cache: {
        keys: ['id', 'withoutBalance'],
        ttl: 60 * 60 * 24,
      },
      handler(ctx: Context) {
        return this.adapter
          .findById(ctx.params.id)
          .then(async (res: Store | null) => {
            if (res) {
              if (res.users) {
                res.subscription = await ctx.call('subscription.sGet', {
                  id: ctx.params.id,
                });
              }
              if (
                res.internal_data &&
                res.internal_data.omsId &&
                !ctx.params.withoutBalance
              ) {
                const omsData = (await ctx
                  .call('oms.getCustomer', {
                    customerId: res.internal_data.omsId,
                  })
                  .then(null, this.logger.error)) as { store: Store };

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
            throw new MpError('Stores Service', 'Store Not Found', 404);
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
      auth: ['Basic'],
      cache: {
        keys: ['filter'],
        ttl: 60 * 60 * 24,
      },
      handler(ctx: Context) {
        let params: {
          where?: {};
          limit?: {};
          skip?: {};
          order?: string;
          sort?: {};
        } = {};
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
          offset: params.skip || 0,
          sort: params.sort,
        };
        if (params.order) {
          const sortArray = params.order.split(' ');
          if (
            sortArray.length === 2 &&
            ['asc', 'desc'].includes(sortArray[1].toLowerCase())
          ) {
            query.sort = { [sortArray[0]]: sortArray[1] === 'asc' ? 1 : -1 };
          }
        }
        return this.adapter.find({ ...query }).then((res: Store[] | null) => {
          // If the DB response not null will return the data
          if (res !== null)
            return res.map(store => this.sanitizeResponse(store));
          // If null return Not Found error
          throw new MpError('Stores Service', 'Store Not Found', 404);
        });
      },
    },
    storesList: {
      auth: ['Basic'],
      cache: {
        keys: ['id', 'page', 'perPage'],
        ttl: 60 * 60 * 24,
      },
      handler(ctx: Context) {
        const query: any = {};
        if (ctx.params.id) {
          query._id = { $regex: new RegExp(`.*${ctx.params.id}.*`, 'i') };
        }
        const findBody: any = { query };
        findBody.limit = Number(ctx.params.perPage) || 50;
        findBody.offset =
          (Number(ctx.params.perPage) || 50) *
          ((Number(ctx.params.page) || 1) - 1);
        return this.adapter
          .find(findBody)
          .then(async (res: Store[]) => {
            return {
              stores: res.map(store => this.sanitizeResponse(store)),
              total: await ctx.call('stores.countStores', {
                key: ctx.params.id,
                query,
              }),
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
        ttl: 60 * 60 * 24,
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
      auth: ['Basic'],
      async handler(ctx: Context) {
        // Clear cache
        this.broker.cacher.clean(`stores.sGet:${ctx.params.url}**`);

        // Sanitize request params
        const store: Store = this.sanitizeStoreParams(ctx.params, true);

        const myStore = await this.adapter
          .insert(store)
          .then((res: Store) => this.sanitizeResponse(res))
          .catch((err: { code: number }) => {
            if (err.code !== 11000) {
              this.logger.error('Create store', err);
            }
            const msg =
              err.code === 11000 ? 'Duplicated entry!' : 'Internal Error!';
            const code = err.code === 11000 ? 422 : 500;
            throw new MpError('Stores Service', msg, code);
          });

        if (myStore.url) {
          this.broker.cacher.clean('stores.list:**');
          this.broker.cacher.clean('stores.storesList:**');
          this.broker.cacher.clean('stores.countStores:**');
          this.cacheUpdate(myStore);
        }

        return myStore;
      },
    },
    /**
     * Update store
     *
     * @param {Store} updateValidation
     * @returns {Store}
     */
    update: {
      auth: ['Basic'],
      async handler(ctx: Context) {
        // Save the ID separate into variable to use it to find the store
        const { id } = ctx.params;
        delete ctx.params.id;
        // storeBefore
        const storeBefore = await ctx.call('stores.findInstance', { id });

        // Sanitize request params
        const store: Store = this.sanitizeStoreParams(ctx.params);

        // Check new values
        Object.keys(store).forEach((key: keyof Store) => {
          if (store[key] === storeBefore[key]) delete store[key];
        });

        // if no new updates
        if (Object.keys(store).length === 0) return storeBefore;

        // Merge internal_data
        if (ctx.params.internal_data) {
          store.internal_data = this.merge2Objects(
            storeBefore.internal_data,
            ctx.params.internal_data
          );
        }

        // Merge external_data
        if (ctx.params.external_data) {
          store.external_data = this.merge2Objects(
            storeBefore.external_data,
            ctx.params.external_data
          );
        }

        const myStore: Store = await this.adapter
          .updateById(id, { $set: store })
          .then(this.sanitizeResponse)
          .catch((error: { code: number }) => {
            this.sendLogs({
              topic: 'store',
              topicId: id,
              message: 'update Store',
              storeId: id,
              logLevel: 'error',
              code: 500,
              payload: { error: error.toString(), params: ctx.params },
            });
            ctx.meta.$statusMessage = 'Internal Server Error';
            ctx.meta.$statusCode = 500;

            return {
              errors: [
                {
                  message:
                    error.code === 11000
                      ? 'Duplicated entry!'
                      : 'Internal Error!',
                },
              ],
            };
          });

        // Clean cache if store updated
        this.broker.cacher.clean(
          `stores.findInstance:${myStore.consumer_key}*`
        );
        this.broker.cacher.clean(`stores.findInstance:*${myStore.url}*`);
        this.broker.cacher.clean('stores.list**');
        this.broker.cacher.clean('stores.storesList:**');
        this.broker.cacher.clean(`products.list:${myStore.consumer_key}*`);
        this.broker.cacher.clean(
          `products.getInstanceProduct:${myStore.consumer_key}*`
        );
        this.cacheUpdate(myStore);

        if (myStore.internal_data && myStore.internal_data.omsId) {
          ctx
            .call('crm.updateStoreById', { id, ...ctx.params })
            .then(null, (error: unknown) => {
              this.sendLogs({
                topic: 'store',
                topicId: id,
                message: 'Update in CRM',
                storeId: id,
                logLevel: 'error',
                code: 500,
                payload: { error: error.toString(), params: ctx.params },
              });
            });
        }

        // Profit update check
        this.emitProfitUpdateEvent(myStore, storeBefore);

        ctx.emit('stores.event', {
          event: 'stores.update',
          storeId: myStore.url,
          res: myStore,
        });
        return myStore;
      },
    },
    sync: {
      auth: ['Basic'],
      cache: {
        ttl: 60 * 60 * 3,
        keys: ['id', 'timestamp'],
      },
      async handler(ctx) {
        const storeId = ctx.params.id;
        const instance = await ctx.call('stores.findInstance', {
          id: storeId,
        });
        try {
          const omsStore = await ctx
            .call('oms.getCustomerByUrl', { storeId })
            .then(
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
              }
            );
          instance.internal_data = {
            ...instance.internal_data,
            omsId: omsStore.id || (omsStore.store && omsStore.store.id),
          };
          this.broker.cacher.clean(`orders.getOrder:${instance.consumer_key}*`);
          this.broker.cacher.clean(
            `orders.list:undefined|${instance.consumer_key}*`
          );
          this.broker.cacher.clean(`invoices.get:${instance.consumer_key}*`);
          this.broker.cacher.clean(`subscription.sGet:${instance.url}*`);
          this.broker.cacher.clean(`stores.sGet:${instance.url}**`);
          this.broker.cacher.clean(`stores.me:${instance.consumer_key}**`);
          return ctx.call('stores.update', {
            id: storeId,
            internal_data: instance.internal_data,
            stock_date: '2010-01-01T00:00:00.000Z',
            price_date: '2010-01-01T00:00:00.000Z',
            stock_status: 'idle',
            price_status: 'idle',
          });
        } catch (err) {
          ctx.meta.$statusCode =
            err.status || (err.error && err.error.statusCode) || 500;
          ctx.meta.$statusMessage =
            err.statusText || (err.error && err.error.name) || 'Internal Error';
          return {
            errors: [
              {
                message: err.error
                  ? err.error.message
                  : 'Internal Server Error',
              },
            ],
          };
        }
      },
    },

    meUpdate: {
      auth: ['Bearer'],
      handler(ctx) {
        const { store } = ctx.meta;
        const { url: id } = store;
        if (ctx.params.external_data) {
          ctx.params.external_data = this.merge2Objects(
            store.internal_data,
            ctx.params.internal_data
          );
        }
        if (ctx.params.address) {
          ctx.params.address.country =
            store.address?.country || ctx.params.address.country;
          ctx.params.address = this.merge2Objects(
            store.address,
            ctx.params.address
          );
        }

        return ctx.call('stores.update', { ...ctx.params, id });
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

        return this.broker
          .call('stores.findInstance', { consumerKey, consumerSecret })
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
            this.broker.cacher.clean(
              `stores.findInstance:${ctx.params.consumerKey}`
            );

            ctx.meta.$statusCode = 401;
            ctx.meta.$statusMessage = 'Unauthorized Error';
            return {
              errors: [
                { field: 'consumerKey', message: 'is not valid' },
                { field: 'consumerSecret', message: 'is not valid' },
              ],
            };
          })
          .then((user: StoreUser) =>
            this.transformEntity(user, true, ctx.meta.token)
          )
          .catch(() => {
            this.broker.cacher.clean(
              `stores.resolveBearerToken:${ctx.meta.token}`
            );

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
        ttl: 60 * 60 * 24 * 30,
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
            }
          );
        })
          .then(async (decoded: { id: any }) => {
            if (decoded.id) {
              // Get instance info
              const instance = await this.broker.call('stores.findInstance', {
                consumerKey: decoded.id,
              });
              if (instance.status) {
                return instance;
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
        ttl: 60 * 60 * 24,
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
        'logo',
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
        this.settings.JWT_SECRET
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

    merge2Objects(oldObj, newObj) {
      return {
        ...oldObj,
        ...newObj,
      };
    },

    async cacheUpdate(_myStore) {
      const store = await this.broker.call('stores.sGet', { id: _myStore.url });
      const myStore = {
        ...store,
        ..._myStore,
      };

      // Set normal with balance
      this.broker.cacher.set(`stores.sGet:${myStore.url}|undefined`, myStore);
      // Set withoutBalance
      this.broker.cacher.set(`stores.sGet:${myStore.url}|1`, myStore);
      this.broker.cacher.set(`stores.me:${myStore.consumer_key}`, myStore);
    },
    isProfitUpdate(store, storeBefore): boolean {
      const profitFields = [
        'sale_price',
        'sale_price_operator',
        'compared_at_price',
        'compared_at_price_operator',
      ];

      for (const profitField of profitFields) {
        if (
          store[profitField] &&
          store[profitField] !== storeBefore[profitField as keyof Store]
        ) {
          return true;
        }
      }
      return false;
    },
    emitProfitUpdateEvent(myStore, storeBefore): void {
      if (this.isProfitUpdate(myStore, storeBefore)) {
        // Send profit update event
        this.broker.emit('stores.event', {
          event: 'stores.update.profit',
          storeId: myStore.url,
          res: myStore,
        });
      }
    },
  },
};

export = TheService;
