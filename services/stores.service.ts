import { Context, Errors, GenericObject, ServiceSchema } from 'moleculer';
import jwt from 'jsonwebtoken';
import { v1 as uuidv1, v4 as uuidv4 } from 'uuid';

import DbService from '../utilities/mixins/mongo.mixin';
import { MpError } from '../utilities/adapters';
import { StoresOpenapi } from '../utilities/mixins/openapi';
import { Oms } from '../utilities/mixins/oms.mixin';
import {
  Log,
  Store,
  StoreUser,
  StoreRequest,
  MetaParams,
  StoreMeta,
  EventArguments,
  Subscription,
  CommonError,
} from '../utilities/types';
import { StoresValidation } from '../utilities/mixins/validation';
import { GCPPubSub } from '../utilities/mixins';

const { MoleculerError, ValidationError } = Errors;

const TheService: ServiceSchema = {
  name: 'stores',
  mixins: [
    new DbService('stores').start(),
    StoresValidation,
    StoresOpenapi,
    GCPPubSub,
    Oms,
  ],
  settings: {
    /** Secret for JWT */
    JWT_SECRET: process.env.JWT_SECRET || 'jwt-conduit-secret',
  },
  events: {
    'stores.event': function ({ event, storeId, res }: EventArguments): void {
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
      rest: 'GET /me',
      handler(ctx: Context<unknown, MetaParams>): Promise<Store> {
        return ctx
          .call<Store[], { query: { consumer_key: string } }>('stores.find', {
            query: { consumer_key: ctx.meta.user },
          })
          .then(async ([res]) => {
            let omsData: { store: Store };
            if (res) {
              if (res.users) {
                res.subscription = await ctx.call<
                  Subscription,
                  { storeId: string }
                >('subscription.getByStore', {
                  storeId: res._id,
                });
              }
              if (res?.internal_data?.omsId) {
                omsData = (await ctx
                  .call<null, Partial<Store>>('oms.getCustomer', {
                    customerId: res.internal_data.omsId,
                  })
                  .then(null, this.logger.error)) as { store: Store };

                // If the DB response not null will return the data
                return this.sanitizeResponse(res, omsData && omsData?.store);
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
    getOne: {
      auth: ['Basic'],
      cache: {
        keys: ['id', 'withoutBalance'],
        ttl: 60 * 60 * 24,
      },
      rest: 'GET /:id',
      handler(ctx: Context<StoreRequest>): Promise<Store> {
        return this.getById(ctx.params.id).then(async (res: Store | null) => {
          if (res) {
            if (res.users) {
              res.subscription = await ctx.call<
                Subscription,
                { storeId: string }
              >('subscription.getByStore', {
                storeId: ctx.params.id,
              });
            }
            if (res?.internal_data?.omsId && !ctx.params.withoutBalance) {
              const omsData = (await ctx
                .call<null, Partial<Store>>('oms.getCustomer', {
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
    getAll: {
      auth: ['Basic'],
      cache: {
        keys: ['filter'],
        ttl: 60 * 60 * 24,
      },
      rest: 'GET /',
      handler(ctx: Context<StoreRequest>): Promise<Store[]> {
        let params: {
          where?: GenericObject;
          limit?: number;
          skip?: number;
          order?: string;
          sort?: GenericObject;
        } = {};
        try {
          params = JSON.parse(ctx.params.filter);
        } catch (err) {
          throw new ValidationError('Filter Error');
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
        return ctx
          .call<Store[], GenericObject>('stores.find', query)
          .then(res => {
            // If the DB response not null will return the data
            if (res) return res.map(store => this.sanitizeResponse(store));
            // If null return Not Found error
            throw new MpError('Stores Service', 'Store Not Found', 404);
          });
      },
    },
    getAllAdmin: {
      auth: ['Basic'],
      cache: {
        keys: ['page', 'perPage'],
        ttl: 60 * 60 * 24,
      },
      rest: 'GET admin',
      handler(
        ctx: Context<StoreRequest>
      ): Promise<{ stores: Store[]; total: number }> {
        const query: GenericObject = {};
        const findBody: GenericObject = { query };
        findBody.pageSize = Number(ctx.params.perPage) || 50;
        findBody.page = Number(ctx.params.page) || 1;

        return ctx
          .call<{ rows: Store[]; total: number }, GenericObject>(
            'stores.list',
            findBody
          )
          .then(async res => {
            return {
              stores: res.rows,
              total: res.total,
            };
          })
          .catch((err: CommonError) => {
            if (err.name === 'MoleculerError') {
              throw new MoleculerError(err.message, err.code);
            }
            throw new MoleculerError(String(err), 500);
          });
      },
    },
    /**
     * Create new store
     *
     * @param {Store} createValidation
     * @returns {Store}
     */
    createOne: {
      auth: ['Basic'],
      rest: 'POST /',
      async handler(ctx: Context<StoreRequest>): Promise<Store> {
        // Clear cache
        this.broker.cacher.clean(`stores.getOne:${ctx.params.url}**`);

        // Sanitize request params
        const store: Store = this.sanitizeStoreParams(ctx.params, true);

        const myStore = await ctx
          .call<Store, Store>('stores.create', store)
          .then(res => this.sanitizeResponse(res) as Store)
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
          this.broker.cacher.clean('stores.getAll:**');
          this.broker.cacher.clean('stores.getAllAdmin:**');
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
    updateOne: {
      auth: ['Basic'],
      rest: 'PUT /:id',
      async handler(ctx: Context<Store, MetaParams>): Promise<Store> {
        // Save the ID separate into variable to use it to find the store
        const { id } = ctx.params;
        // storeBefore
        const storeBefore: Store = await ctx.call<Store, { id: string }>(
          'stores.get',
          { id }
        );

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

        const responseStore = await ctx
          .call<Store, Store>('stores.update', store)
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

        // Workaround for Store type, clean it up
        const myStore = responseStore as Store;

        // Clean cache if store updated
        this.broker.cacher.clean('stores.getAll**');
        this.broker.cacher.clean('stores.getAllAdmin:**');
        this.broker.cacher.clean(`products.list:${myStore.consumer_key}*`);
        this.broker.cacher.clean(
          `products.getInstanceProduct:${myStore.consumer_key}*`
        );
        this.cacheUpdate(myStore);

        if (myStore?.internal_data?.omsId) {
          ctx
            .call<null, Partial<Store>>('crm.updateStoreById', {
              id,
              ...ctx.params,
            })
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
            })
            .catch(err => this.logger.error(err));
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
      rest: 'PUT /:id/sync',
      async handler(ctx): Promise<unknown> {
        const storeId = ctx.params.id;
        const instance = await ctx.call<Store, { id: string }>('stores.get', {
          id: storeId,
        });
        try {
          const omsStore = await ctx
            .call<unknown, Partial<StoreRequest>>('oms.getCustomerByUrl', {
              storeId,
            })
            .then(
              (response: GenericObject) => response.store,
              (err: CommonError) => {
                if (err.code !== 404) {
                  throw new MoleculerError(err.message, err.code || 500);
                }
                if (err.code === 404) {
                  return this.createOmsStore(instance).then(
                    (value: unknown) => {
                      return value;
                    }
                  );
                }
              }
            );
          instance.internal_data = {
            ...instance.internal_data,
            omsId: omsStore.id || omsStore.store?.id,
          };
          this.broker.cacher.clean(`orders.getOrder:${instance.consumer_key}*`);
          this.broker.cacher.clean(
            `orders.list:undefined|${instance.consumer_key}*`
          );
          this.broker.cacher.clean(`invoices.get:${instance.consumer_key}*`);
          this.broker.cacher.clean(`subscription.getByStore:${instance.url}*`);
          this.broker.cacher.clean(`stores.getOne:${instance.url}**`);
          this.broker.cacher.clean(`stores.me:${instance.consumer_key}**`);
          return ctx.call<GenericObject, Partial<Store>>('stores.updateOne', {
            id: storeId,
            internal_data: instance.internal_data,
            stock_date: '2010-01-01T00:00:00.000Z',
            price_date: '2010-01-01T00:00:00.000Z',
            stock_status: 'idle',
            price_status: 'idle',
          });
        } catch (err) {
          ctx.meta.$statusCode = err.status || err.error?.statusCode || 500;
          ctx.meta.$statusMessage =
            err.statusText || err.error?.name || 'Internal Error';
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
      rest: 'PUT /me',
      handler(ctx): Promise<Store> {
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

        return ctx.call<Store, Partial<Store>>('stores.updateOne', {
          ...ctx.params,
          id,
        });
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
      handler(ctx: Context<StoreRequest, StoreMeta>): Promise<GenericObject> {
        const { consumerKey, consumerSecret } = ctx.params;

        return ctx
          .call<Store[], { query: { consumer_key: string } }>('stores.find', {
            query: { consumer_key: consumerKey },
          })
          .then(([instance]) => {
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

            ctx.meta.$statusCode = 401;
            ctx.meta.$statusMessage = 'Unauthorized Error';
            return {
              errors: [
                { field: 'consumerKey', message: 'is not valid' },
                { field: 'consumerSecret', message: 'is not valid' },
              ],
            };
          })
          .then(user => this.transformEntity(user, true, ctx.meta.token))
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
      visibility: 'public',
      handler(ctx: Context<Partial<StoreRequest>>): Promise<GenericObject> {
        return new this.Promise((resolve: any, reject: any) => {
          jwt.verify(
            ctx.params.token,
            this.settings.JWT_SECRET,
            (error: Error, decoded: GenericObject) => {
              if (error) {
                reject(false);
              }

              resolve(decoded);
            }
          );
        })
          .then(async (decoded: { id: string }) => {
            if (decoded.id) {
              // Get instance info
              const [instance] = await ctx.call<
                Store[],
                { query: { consumer_key: string } }
              >('stores.find', {
                query: { consumer_key: decoded.id },
              });

              if (instance.status) {
                return this.sanitizeResponse(instance);
              }
            }

            return false;
          })
          .catch(() => {
            return false;
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
    sanitizeStoreParams(params, create = false): unknown {
      const store: Store | GenericObject = {};
      // Some initial data when creating store
      if (create) {
        store._id = params.url.toLowerCase();
        store.consumer_key = uuidv1();
        store.consumer_secret = uuidv4();
        store.created = new Date();
        store.updated = new Date();
        store.status = params.status || 'pending';
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
    sanitizeResponse(store: Store, omsData = false): Store {
      store.url = store._id;
      delete store._id;
      if (omsData) {
        store.debit = parseFloat(omsData.debit.toFixed(2));
        store.credit = parseFloat(omsData.credit.toFixed(2));
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
    generateJWT(user): string {
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
    transformEntity(user, withToken, token): GenericObject {
      if (user) {
        if (withToken) {
          user.token = token || this.generateJWT(user);
        }
      }

      return { channel: user };
    },

    merge2Objects(oldObj, newObj): GenericObject {
      return {
        ...oldObj,
        ...newObj,
      };
    },

    async cacheUpdate(_myStore): Promise<void> {
      const store = await this.broker.call('stores.getOne', {
        id: _myStore.url,
      });
      const myStore = {
        ...store,
        ..._myStore,
      };

      // Set normal with balance
      this.broker.cacher.set(`stores.getOne:${myStore.url}|undefined`, myStore);
      // Set withoutBalance
      this.broker.cacher.set(`stores.getOne:${myStore.url}|1`, myStore);
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
