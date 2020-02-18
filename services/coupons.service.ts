import { Context, Errors, ServiceSchema } from 'moleculer';
import DbService from '../utilities/mixins/mongo.mixin';
import { CouponsOpenapi } from '../utilities/mixins/openapi';
import { Coupon } from '../utilities/types';
import { CouponsValidation } from '../utilities/mixins/validation';
const MoleculerError = Errors.MoleculerError;

const TheService: ServiceSchema = {
  name: 'coupons',
  mixins: [DbService('coupons'), CouponsValidation, CouponsOpenapi],
  actions: {
    create: {
      auth: 'Basic',
      handler(ctx: Context): Promise<Coupon> {
        const { params } = ctx;
        if (params.type === 'salesorder' && typeof params.discount === 'number') {
          const error = new MoleculerError('Parameters validation error!', 422, 'VALIDATION_ERROR', [{
            type: 'object',
            field: 'discount',
            actual: params.discountType,
            message: 'The \'discount\' field must be an object!',
          }]);
          error.name = 'Validation error';
          throw error;
        }
        if (params.type === 'subscription' && (typeof params.discount !== 'number' || !params.discountType)) {
          const error = new MoleculerError('Parameters validation error!', 422, 'VALIDATION_ERROR', [{
            type: 'enumValue',
            expected: [
              '$',
              '%',
            ],
            actual: String(params.discountType),
            field: 'discountType',
            message: 'The \'discountType\' field is required!',
          }]);
          error.name = 'Validation error';
          throw error;
        }
        return this.adapter
          .insert(this.createCouponSanitize(ctx.params))
          .then((res: Coupon) => {
            this.broker.cacher.clean('coupons.list:**');
            return this.normalizeId(res);
          })
          .catch((err: any) => {
            if (err.name === 'MoleculerError') {
              throw new MoleculerError(err.message, err.code);
            }
            throw new MoleculerError(err, 500);
          });
      },
    },
    get: {
      auth: 'Basic',
      cache: {
        keys: ['id', 'membership'],
        ttl: 60 * 60, // 1 hour
      },
      handler(ctx: Context): Promise<Coupon> {
        const query: { [key: string]: {} } = {
          _id: ctx.params.id.toUpperCase(),
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() },
        };
        if (ctx.params.membership) {
          query.appliedMemberships = ctx.params.membership;
        }
        if (ctx.params.type) {
          query.type = ctx.params.type;
        }
        return this.adapter
          .findOne(query)
          .then((res: Coupon) => {
            if (!res) {
              throw new MoleculerError('No Coupon found for this ID or Membership', 404);
            }
            if (res.maxUses <= res.useCount) {
              throw new MoleculerError('Coupon exceeded maximum usage!', 403);
            }
            return this.normalizeId(res);
          })
          .catch((err: any) => {
            if (err.name === 'MoleculerError') {
              throw new MoleculerError(err.message, err.code);
            }
            throw new MoleculerError(err, 500);
          });
      },
    },
    list: {
      auth: 'Basic',
      cache: {
        ttl: 60 * 60, // 1 hour
      },
      handler(): Promise<Coupon[]> {
        return this.adapter
          .find()
          .then((res: Coupon[]) => {
            if (res.length !== 0) return res.map(coupon => this.normalizeId(coupon));
            throw new MoleculerError('No Coupons found!', 404);
          })
          .catch((err: any) => {
            if (err.name === 'MoleculerError') {
              throw new MoleculerError(err.message, err.code);
            }
            throw new MoleculerError(err, 500);
          });
      },
    },
    update: {
      auth: 'Basic',
      async handler(ctx: Context): Promise<Coupon> {
        const id = ctx.params.id.toUpperCase();
        const updateBody = { ...ctx.params };
        delete updateBody.id;
        return this.adapter
          .updateById(id, { $set: updateBody })
          .then((coupon: Coupon) => {
            if (!coupon) {
              throw new MoleculerError('No Coupons found!', 404);
            }

            this.broker.cacher.clean('coupons.list:**');
            this.broker.cacher.clean(`coupons.get:${id}*`);
            return coupon;
          })
          .catch((err: any) => {
            throw new MoleculerError(err, 500);
          });
      },
    },
    updateCount: {
      auth: 'Basic',
      async handler(ctx: Context) {
        return this.adapter
          .updateById(ctx.params.id.toUpperCase(), { $inc: { useCount: 1 } })
          .then((coupon: Coupon) => {
            if (!coupon) {
              throw new MoleculerError('No Coupons found!', 404);
            }

            this.broker.cacher.clean('coupons.list:**');
            this.broker.cacher.clean(`coupons.get:${ctx.params.id}*`);
            return coupon;
          })
          .catch((err: any) => {
            throw new MoleculerError(err, 500);
          });
      },
    },
  },
  methods: {
    /**
     * Convert object _id to id
     *
     * @param {({_id: string})} obj
     * @returns
     */
    normalizeId(obj: { _id: string }) {
      const newObj = {
        code: obj._id,
        ...obj,
      };
      delete newObj._id;
      return newObj;
    },
    /**
     * Sanitizes Coupon entry data
     *
     * @param {*} params
     * @returns Coupon
     */
    createCouponSanitize(params) {
      return {
        _id: params.code,
        type: params.type, // Coupon type 'salesorder | subscription'
        useCount: 0,
        startDate: new Date(params.startDate),
        endDate: new Date(params.endDate),
        discount: params.discount, // Integer | Object { tax, shipping, total }
        discountType: params.discountType,
        maxUses: params.maxUses,
        appliedMemberships: params.appliedMemberships,
        auto: params.auto, // Auto apply 'boolean'
      };
    },
  },
};

export = TheService;
