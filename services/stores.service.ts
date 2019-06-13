import { Context, ServiceSchema } from 'moleculer';
import DbService from '../utilities/mixins/mongo.mixin';

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
          .then((res: Store | boolean) => {
            if (res !== null) {
              return res;
            }
            ctx.meta.$statusMessage = 'Not Found';
            ctx.meta.$statusCode = 404;
            return { error: [{ message: 'Store Not Found' }] };
          });
      }
    },
    me: {
      auth: 'Bearer',
      cache: {
        keys: ['#user'],
        ttl: 60 * 60 // 1 hour
      },
      handler(ctx: Context) {
        return this.adapter
          .findOne({ consumer_key: ctx.meta.user })
          .then((res: Store | boolean) => {
            if (res !== null) {
              return res;
            }
            ctx.meta.$statusMessage = 'Not Found';
            ctx.meta.$statusCode = 404;
            return { error: [{ message: 'Store Not Found' }] };
          });
      }
    },
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
        return this.adapter.findById(ctx.params.id).then((res: Store | boolean) => {
          if (res !== null) {
            return res;
          }
          ctx.meta.$statusMessage = 'Not Found';
          ctx.meta.$statusCode = 404;
          return { error: [{ message: 'Store Not Found' }] };
        });
      }
    },
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
        return this.adapter.find(ctx.params.filter.where, { limit: ctx.params.filter.limit || 10 });
      }
    },
    create: {
      auth: 'Basic',
      params: createValidation,
      async handler(ctx: Context) {
        this.broker.cacher.clean(`stores.get:**`);
        this.broker.cacher.clean(`stores.list:**`);
        const id = ctx.params.url;
        delete ctx.params.url;
        let mReq: [] | {} = [];
        try {
          mReq = await this.adapter.insert({ ...ctx.params, _id: id });
        } catch (err) {
          ctx.meta.$statusMessage = 'Internal Server Error';
          ctx.meta.$statusCode = 500;
          mReq = {
            errors: [{ message: err.code === 11000 ? 'Duplicated entry!' : 'Internal Error!' }]
          };
        }
        return mReq;
      }
    },
    update: {
      auth: 'Basic',
      params: updateValidation,
      async handler(ctx: Context) {
        const { id } = ctx.params;
        delete ctx.params.id;
        this.broker.cacher.clean(`stores.**`);
        let mReq: { [key: string]: any } = [];
        try {
          mReq = await this.adapter.updateById(id, { $set: { ...ctx.params } });
          if (mReq === null) {
            ctx.meta.$statusMessage = 'Not Found';
            ctx.meta.$statusCode = 404;
            mReq = {
              errors: [{ message: 'Store Not Found' }]
            };
          }
          if (mReq.consumer_key) {
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
  methods: {}
};

export = TheService;
