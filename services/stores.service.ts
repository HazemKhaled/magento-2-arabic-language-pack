import { Context, Errors, GenericObject, ServiceSchema } from 'moleculer';
import jwt from 'jsonwebtoken';
import { v1 as uuidv1, v4 as uuidv4 } from 'uuid';

import DbService from '../utilities/mixins/mongo.mixin';
import { MpError } from '../utilities/adapters';
import { StoresOpenapi } from '../utilities/mixins/openapi';
import { Oms } from '../utilities/mixins/oms.mixin';
import {
  Log,
  ListParams,
  Store,
  StoreDb,
  StoreUser,
  MetaParams,
  EventArguments,
  Subscription,
  CommonError,
} from '../utilities/types';
import { StoresValidation } from '../utilities/mixins/validation';
import { GCPPubSub } from '../utilities/mixins';

const { MoleculerError } = Errors;

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
      cache: false,
      rest: 'GET /me',
      handler(ctx: Context<unknown, MetaParams>): Promise<Store> {
        return ctx.call<Store, { id: string }>('stores.get', {
          id: ctx.meta.storeId,
        });
      },
    },
    /**
     * Get store by url with subscription and OMS info
     *
     * @param {string} url
     * @returns {Store}
     */
    get: {
      auth: ['Basic'],
      cache: {
        keys: ['withoutBalance', 'withoutSubscription'],
        ttl: 60 * 60 * 24,
      },
      visibility: 'published',
      handler(
        ctx: Context<{
          id: string;
          withoutBalance?: boolean;
          withoutSubscription?: boolean;
        }>
      ): Promise<Store> {
        return this._get(ctx, { id: ctx.params.id })
          .then(async (res: Store) => {
            if (!res) {
              // If null return Not Found error
              throw new MpError('Stores Service', 'Store Not Found', 404);
            }

            // get subscription details
            if (!ctx.params.withoutSubscription) {
              res.subscription = await ctx.call<
                Subscription,
                { storeId: string }
              >('subscription.getByStore', {
                storeId: ctx.params.id,
              });
            }

            if (res?.internal_data?.omsId && !ctx.params.withoutBalance) {
              const omsData = (await ctx
                .call<null, Partial<{ customerId: string }>>(
                  'oms.getCustomer',
                  {
                    customerId: res.internal_data.omsId,
                  }
                )
                .then(null, this.logger.error)) as { store: Store };

              // If the DB response not null will return the data
              if (!omsData) {
                this.logger.warn('Can not get balance', ctx.params);
              } else {
                return this.transformResultEntity(res, omsData.store);
              }
            }

            // return store even if we didn't get balance from OMS
            return this.transformResultEntity(res);
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
     * List all stores
     *
     * @param {Array.<String>}  populate
     * @param {Array.<String>}  fields
     * @param {Number}          page
     * @param {String}          pageSize
     * @param {String}          sort
     * @param {Object}          query
     *
     * @return {Object}         {Promise<{ stores: Store[]; total: number }>}
     */
    list: {
      auth: ['Basic'],
      visibility: 'published',
      handler(
        ctx: Context<ListParams>
      ): Promise<{ stores: Store[]; total: number }> {
        const params = this.sanitizeParams(ctx, ctx.params);
        return this._list(ctx, params).then(
          (res: { rows: Store[]; total: number }) => {
            // If the DB response not null will return the data
            if (res)
              return {
                stores: res.rows.map((store: Store) =>
                  this.transformResultEntity(store)
                ),
                total: res.total,
              };
            // If null return Not Found error
            throw new MpError('Stores Service', 'Store Not Found', 404);
          }
        );
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
      visibility: 'published',
      handler(ctx: Context<Store>): Promise<Store> {
        // Sanitize request params
        const store: Store = this.sanitizeStoreParams(ctx.params, true);
        return this._create(ctx, store)
          .then((res: Store) => this.transformResultEntity(res))
          .catch((err: { code: number }) => {
            if (err.code !== 11000) {
              this.logger.error('Create store', err);
            }
            const msg =
              err.code === 11000 ? 'Duplicated entry!' : 'Internal Error!';
            const code = err.code === 11000 ? 422 : 500;
            throw new MpError('Stores Service', msg, code);
          });
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
      visibility: 'published',
      async handler(ctx: Context<Store, MetaParams>): Promise<Store> {
        // Save the ID separate into variable to use it to find the store
        const { id } = ctx.params;
        // storeBefore
        const storeBefore = await ctx
          .call<Store, { id: string }>('stores.get', { id })
          .catch(err => {
            throw new MpError(
              'Stores Service',
              err.code === 404
                ? 'Store not found ! !'
                : 'Internal Server error',
              err.code
            );
          });

        // Sanitize request params
        const store: StoreDb = this.sanitizeStoreParams(ctx.params);

        // Check new values
        Object.keys(store).forEach((key: keyof Store) => {
          if (store[key] === storeBefore[key]) delete store[key];
        });

        // if no new updates
        if (Object.keys(store).length === 0) {
          return this.transformResultEntity(storeBefore);
        }

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
        store.id = id;
        const responseStore = await this._update(ctx, store)
          .then((res: Store) => this.transformResultEntity(res))
          .catch((error: { code: number }) => {
            this.sendLogs({
              topic: 'store',
              topicId: store.url,
              message: 'update Store',
              storeId: store.url,
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

        if (myStore?.internal_data?.omsId) {
          ctx
            .call<
              null,
              {
                id: string;
                data: Store[];
                module: string;
              }
            >('crm.updateRecord', {
              id: store.url,
              module: 'accounts',
              data: [ctx.params],
            })
            .then(null, (error: unknown) => {
              this.sendLogs({
                topic: 'store',
                topicId: store.url,
                message: 'Update in CRM',
                storeId: store.url,
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
    /**
     * sync store
     *
     * @param {id} sync
     * @returns {unknown}
     */
    flushCache: {
      auth: ['Basic'],
      cache: {
        keys: ['url', 'timestamp'],
        ttl: 60 * 60 * 3,
      },
      rest: 'PUT /:url/sync',
      async handler(
        ctx: Context<{ url: string; timestamp: number }, MetaParams>
      ): Promise<unknown> {
        const { url } = ctx.params;
        const instance = await ctx.call<Store, { id: string }>('stores.get', {
          id: url,
        });

        try {
          const omsStore = await ctx
            .call<unknown, Partial<{ storeId: string }>>(
              'oms.getCustomerByUrl',
              { storeId: url }
            )
            .then(
              (response: { store: Store }) => response.store,
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
          return ctx.call<Store, Partial<Store>>('stores.update', {
            id: url,
            internal_data: instance.internal_data,
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
    /**
     * me update
     *
     * @action meUpdate
     * @returns {Store}
     */
    meUpdate: {
      auth: ['Bearer'],
      rest: 'PUT /me',
      handler(ctx: Context<Store, MetaParams>): Promise<Store> {
        const { store } = ctx.meta;
        const { url } = store;
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

        return ctx.call<Store, Partial<Store>>('stores.update', {
          ...ctx.params,
          id: url,
        });
      },
    },
    /**
     * Login with consumerKey & consumerSecret
     *
     * @actions
     * @param {Object} user - User credentials
     *
     * @returns {Object} Logged in user with token
     */
    login: {
      handler(
        ctx: Context<
          { consumerKey: string; consumerSecret: string },
          MetaParams
        >
      ): Promise<{
        _id: string;
        url: string;
        status: string;
        currency: string;
      }> {
        const { consumerKey, consumerSecret } = ctx.params;
        return this._find(ctx, {
          query: { consumer_key: consumerKey },
        })
          .then(([instance]: Store[]) => {
            if (
              consumerKey === instance.consumer_key &&
              consumerSecret === instance.consumer_secret
            ) {
              const store = this.transformResultEntity(instance);
              return {
                _id: store.consumer_key,
                url: store.url,
                status: store.status,
                currency: store.currency,
              };
            }
            // If wrong consumerSecret return Unauthorized error
            throw new MpError(
              'Stores Service',
              `consumerSecret is wrong, (login)!`,
              401
            );
          })
          .then((user: Store) =>
            this.transformEntity(user, true, ctx.meta.token)
          )
          .catch((err: CommonError) => {
            // If wrong consumerKey or consumerSecret return Unauthorized error
            throw new MpError(
              'Stores Service',
              err.code
                ? err.message
                : 'consumerKey or consumerSecret is wrong, (login)!',
              401
            );
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
      handler(ctx: Context<{ token: string }>): Promise<Store | boolean> {
        return new Promise<{ id: string }>((resolve, reject) => {
          jwt.verify(
            ctx.params.token,
            this.settings.JWT_SECRET,
            (error: Error, decoded: { id: string }) => {
              if (error) {
                reject(error);
              }

              resolve(decoded);
            }
          );
        })
          .then((decoded: { id: string }) => {
            if (decoded.id) {
              // Get instance info
              return this._find(ctx, {
                query: { consumer_key: decoded.id },
              }).then(([instance]: Store[]) => {
                if (instance.status) {
                  return this.transformResultEntity(instance);
                } else {
                  return false;
                }
              });
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
        store.sale_price = store.sale_price || 1.7;
        store.sale_price_operator = store.sale_price_operator || 1;
        store.compared_at_price = store.compared_at_price || 1.7;
        store.compared_at_price_operator =
          store.compared_at_price_operator || 1;
        store.currency = store.currency || 'USD';
        store.shipping_methods = store.shipping_methods || [
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
          first_name: user.first_name,
          last_name: user.last_name,
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
     * Transform a result entity
     *
     * @param {Context} ctx
     * @param {Object} entity
     * @param {Object} omsData
     */
    transformResultEntity(entity: StoreDb, omsData = false): Store | boolean {
      if (!entity) return false;

      const { _id, ...store } = entity;

      store.url = _id;
      if (omsData) {
        store.debit = parseFloat(omsData.debit.toFixed(2));
        store.credit = parseFloat(omsData.credit.toFixed(2));
      }
      return this.sanitizeObject(store);
    },
    /**
     * Sanitize store
     *
     * @param {Store} store
     * @returns {Store}
     */
    sanitizeObject(object): GenericObject {
      return Object.entries(object).reduce(
        (acc, [key, val]) =>
          val === null || val === undefined
            ? acc
            : {
                ...acc,
                [key]: val,
              },
        {}
      );
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
