import jwt from 'jsonwebtoken';
import { Context, Errors, ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';

import { UsersOpenapi } from '../utilities/mixins/openapi';
import { Store, StoreUser } from '../utilities/types';

const { MoleculerClientError } = Errors;

const TheService: ServiceSchema = {
  name: 'users',
  mixins: [UsersOpenapi],

  /**
   * Default settings
   */
  settings: {
    /** Secret for JWT */
    JWT_SECRET: process.env.JWT_SECRET || 'jwt-conduit-secret',

    /** Public fields */
    fields: ['_id'],

    /** Validator schema for entity */
    entityValidator: {
      consumerKey: { type: 'string' },
      consumerSecret: { type: 'string' }
    }
  },

  /**
   * Actions
   */
  actions: {
    /**
     * Login with consumerKey & consumerSecret
     *
     * @actions
     * @param {Object} user - User credentials
     *
     * @returns {Object} Logged in user with token
     */
    login: {
      params: {
        consumerKey: { type: 'string' },
        consumerSecret: { type: 'string' }
      },
      handler(ctx: Context) {
        const { consumerKey, consumerSecret } = ctx.params;

        return this.Promise.resolve(
          this.broker.call('stores.findInstance', { consumerKey, consumerSecret })
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
                currency: instance.currency
              };
            }
            this.broker.cacher.clean(`stores.findInstance:${ctx.params.consumerKey}`);

            ctx.meta.$statusCode = 401;
            ctx.meta.$statusMessage = 'Unauthorized Error';
            return {
              errors: [
                { field: 'consumerKey', message: 'is not valid' },
                { field: 'consumerSecret', message: 'is not valid' }
              ]
            };
          })
          .then((user: StoreUser) => this.transformEntity(user, true, ctx.meta.token))
          .catch(() => {
            this.broker.cacher.clean(`users.resolveBearerToken:${ctx.meta.token}`);

            ctx.meta.$statusCode = 401;
            ctx.meta.$statusMessage = 'Unauthorized Error';
            return {
              errors: [
                { field: 'consumerKey', message: 'is not valid' },
                { field: 'consumerSecret', message: 'is not valid' }
              ]
            };
          });
      }
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
        ttl: 60 * 60 // 1 hour
      },
      params: {
        token: 'string'
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
                consumerKey: decoded.id
              });
              if (instance.status) {
                return decoded;
              }
            }
          })
          .catch(() => {
            return false;
          });
      }
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
        ttl: 60 * 60 // 1 hour
      },
      params: {
        token: 'string'
      },
      handler(ctx: Context) {
        return fetch(`${process.env.AUTH_BASEURL}/login`, {
          headers: {
            Authorization: `Basic ${ctx.params.token}`
          }
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
      }
    }
  },

  /**
   * Methods
   */
  methods: {
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
          exp: Math.floor(exp.getTime() / 1000)
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
    }
  }
};

export = TheService;
