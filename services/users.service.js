const { MoleculerClientError } = require('moleculer').Errors;

const jwt = require('jsonwebtoken');
const KlayerLib = require('../libs/klayer');

const DbService = require('../mixins/db.mixin');

module.exports = {
  name: 'users',
  mixins: [DbService('users')],

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
      handler(ctx) {
        const { consumerKey, consumerSecret } = ctx.params;

        return this.Promise.resolve()
          .then(async () => {
            const klayer = new KlayerLib();
            try {
              let instance = await klayer.findInstance(consumerKey);
              instance = instance['0'];
              if (!instance) {
                return this.Promise.reject(
                  new MoleculerClientError('consumerKey or consumerSecret is invalid!', 422, '', [
                    { field: 'consumerKey', message: 'is not found' }
                  ])
                );
              }
              if (consumerKey === instance.webhook_hash && consumerSecret === instance.secret) {
                return {
                  _id: instance.webhook_hash,
                  url: instance.url,
                  status: instance.status,
                  base_currency: instance.base_currency
                };
              }
              return this.Promise.reject(
                new MoleculerClientError('consumerKey or consumerSecret is invalid!', 422, '', [
                  { field: 'consumerKey', message: 'is not valid' },
                  { field: 'consumerSecret', message: 'is not valid' }
                ])
              );
            } catch (err) {
              return this.Promise.reject(new MoleculerClientError(err));
            }
          })
          .then(user => this.transformEntity(user, true, ctx.meta.token));
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
    resolveToken: {
      cache: {
        keys: ['token'],
        ttl: 60 * 60 // 1 hour
      },
      params: {
        token: 'string'
      },
      handler(ctx) {
        return new this.Promise((resolve, reject) => {
          jwt.verify(ctx.params.token, this.settings.JWT_SECRET, (err, decoded) => {
            if (err) return reject(err);

            resolve(decoded);
          });
        }).then(async decoded => {
          if (decoded.id) {
            // Get instance info from Klayer
            const klayer = new KlayerLib();
            const instance = await klayer.findInstance(decoded.id);
            if (instance[0].status === 'confirmed') {
              return decoded;
            }
          }
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
     * Transform returned user entity. Generate JWT token if neccessary.
     *
     * @param {Object} user
     * @param {Boolean} withToken
     */
    transformEntity(user, withToken, token) {
      if (user) {
        if (withToken) user.token = token || this.generateJWT(user);
      }

      return { channel: user };
    }
  }
};
