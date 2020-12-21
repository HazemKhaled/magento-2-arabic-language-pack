import { Context, Errors, ServiceSchema, GenericObject } from 'moleculer';

import DbService from '../utilities/mixins/mongo.mixin';
import { Coupon, CommonError, CouponQueryType } from '../utilities/types';
import { CouponsValidation, CouponsOpenapi } from '../utilities/mixins';
import { MpError } from '../utilities/adapters';

const MoleculerError = Errors.MoleculerError;

const TheService: ServiceSchema = {
  name: 'coupons',
  mixins: [new DbService('coupons').start(), CouponsValidation, CouponsOpenapi],
  actions: {
    createOne: {
      auth: ['Basic'],
      rest: 'POST /',
      handler(ctx: Context<Coupon>): Promise<Coupon> {
        // Different coupon types validation
        this.couponTypeCheck(ctx.params);

        return ctx
          .call<Coupon, Coupon>(
            'coupons.create',
            this.createCouponSanitize(ctx.params)
          )
          .then(res => {
            this.broker.cacher.clean('coupons.getAll:**');

            return this.normalizeId(res);
          })
          .catch((err: CommonError) => {
            if (err.name === 'MoleculerError') {
              throw new MpError('Coupon Service', err.message, err.code);
            }
            if (err.name === 'MongoError' && err.code === 11000) {
              throw new MpError(
                'Coupon Service',
                'Duplicate coupon code!',
                422
              );
            }
            throw new MpError('Coupon Service', String(err), 500);
          });
      },
    },
    getOne: {
      auth: ['Basic'],
      cache: {
        keys: ['id', 'membership'],
        ttl: 60 * 60 * 24,
      },
      rest: 'GET /:id',
      handler(ctx: Context<Coupon>): Promise<Coupon> {
        const query: CouponQueryType = {
          _id: ctx.params.id.toUpperCase(),
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() },
          type: 'subscription',
        };
        if (ctx.params.membership) {
          query.appliedMemberships = ctx.params.membership;
        }
        if (ctx.params.type) {
          query.type = ctx.params.type;
        }
        return ctx
          .call<Coupon[], { query: CouponQueryType }>('coupons.find', { query })
          .then(([res]) => {
            if (!res) {
              throw new MoleculerError(
                'No Coupon found for this ID or Membership',
                404
              );
            }
            if (res.maxUses <= res.useCount) {
              throw new MoleculerError('Coupon exceeded maximum usage!', 403);
            }
            return this.normalizeId(res);
          })
          .catch((err: CommonError) => {
            if (err.name === 'MoleculerError') {
              throw new MoleculerError(err.message, err.code);
            }
            throw new MoleculerError(String(err), 500);
          });
      },
    },
    getAll: {
      auth: ['Basic'],
      cache: {
        ttl: 60 * 60 * 24,
        keys: ['membership', 'type', 'isValid', 'isAuto'],
      },
      rest: 'GET /',
      handler(ctx: Context<Coupon>): Promise<Coupon[]> {
        this.couponListValidation(ctx.params);
        const query: CouponQueryType = {};
        const isAuto = Number(ctx.params.isAuto);
        const isValid = Number(ctx.params.isValid);
        if (isValid) {
          query.startDate = { $lte: new Date() };
          query.endDate = { $gte: new Date() };
          query.$expr = { $gt: ['$maxUses', '$useCount'] };
          query.minAppliedAmount = { $lte: Number(ctx.params.totalAmount) };
        }
        if (isAuto) {
          query.auto = Boolean(isAuto);
        }
        if (ctx.params.id) {
          query._id = ctx.params.id.toUpperCase();
        }
        if (ctx.params.membership) {
          query.appliedMemberships = ctx.params.membership;
        }
        if (ctx.params.type) {
          query.type = ctx.params.type;
        }
        return ctx
          .call<Coupon[], { query: CouponQueryType }>('coupons.find', { query })
          .then(res => {
            if (res.length) return res.map(coupon => this.normalizeId(coupon));
            throw new MoleculerError('No Coupons found!', 404);
          })
          .catch((err: CommonError) => {
            if (err.name === 'MoleculerError') {
              throw new MoleculerError(err.message, err.code);
            }
            throw new MoleculerError(String(err), 500);
          });
      },
    },
    updateOne: {
      auth: ['Basic'],
      rest: 'PUT /:id',
      async handler(ctx: Context<Coupon>): Promise<Coupon> {
        this.couponTypeCheck(ctx.params);

        const updateBody: Coupon = {
          ...ctx.params,
          id: ctx.params.id.toUpperCase(),
          updatedAt: new Date(),
        };
        if (updateBody.startDate) {
          updateBody.startDate = new Date(updateBody.startDate);
        }
        if (updateBody.endDate) {
          updateBody.endDate = new Date(updateBody.endDate);
        }

        return ctx
          .call<Coupon, Coupon>('coupons.update', updateBody)
          .then(coupon => {
            if (!coupon) {
              throw new MoleculerError('No Coupons found!', 404);
            }

            this.broker.cacher.clean('coupons.getAll:**');
            this.broker.cacher.clean(`coupons.getOne:${updateBody.id}*`);

            coupon.code = coupon._id;
            delete coupon._id;
            return coupon;
          })
          .catch((err: CommonError) => {
            throw new MoleculerError(String(err), 500);
          });
      },
    },
    updateCount: {
      auth: ['Basic'],
      visibility: 'public',
      async handler(ctx: Context<Coupon>): Promise<Coupon | boolean> {
        return this.adapter
          .updateMany(
            { _id: ctx.params.id.toUpperCase() },
            { $inc: { useCount: 1 } }
          )
          .then((coupon: unknown) => {
            if (!coupon) {
              throw new MoleculerError('No Coupons found!', 404);
            }

            this.broker.cacher.clean('coupons.getAll:**');
            this.broker.cacher.clean(`coupons.getOne:${ctx.params.id}*`);
            this.clearCache();

            return coupon;
          })
          .catch((err: CommonError) => {
            throw new MoleculerError(String(err), 500);
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
    normalizeId(obj: { _id: string }): GenericObject {
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
    createCouponSanitize(params): Coupon {
      const coupon: Coupon = {
        _id: params.code,
        // Coupon type 'salesorder | subscription'
        type: params.type,
        useCount: 0,
        startDate: new Date(params.startDate),
        endDate: new Date(params.endDate),
        // Object { tax, shipping, total }
        discount: params.discount,
        maxUses: params.maxUses,
        minAppliedAmount: params.minAppliedAmount || 0,
        appliedMemberships: params.appliedMemberships,
        // Auto apply 'boolean'
        auto: params.auto,
        // Add created and updated dates of the coupon
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (params.campaignName) {
        coupon.campaignName = params.campaignName;
      }
      return coupon;
    },
    /**
     * Validate different coupons type
     *
     * @param {Coupon} params
     */
    couponTypeCheck(params): void {
      if (
        params.type === 'salesorder' &&
        (!params.discount || Object.keys(params.discount).length < 1)
      ) {
        const error = new MoleculerError(
          'Parameters validation error!',
          422,
          'VALIDATION_ERROR',
          [
            {
              type: 'object',
              field: 'discount',
              expected: {
                '‘total‘ | ‘shipping‘ | ‘tax‘': {
                  value: 'number',
                  type: '‘%‘ | ‘$‘',
                },
              },
              actual: params.discount,
              message: "The 'discount' object must have at least one field!",
            },
          ]
        );
        error.name = 'Validation error';
        throw error;
      }
      if (params.type === 'subscription' && !params.discount?.total) {
        const error = new MoleculerError(
          'Parameters validation error!',
          422,
          'VALIDATION_ERROR',
          [
            {
              type: 'enumValue',
              expected: {
                'discount.total': {
                  value: 'number',
                  type: '‘%‘ | ‘$‘',
                },
              },
              actual: params.discount,
              field: 'discount.total',
              message: "The 'discount.total' field is required!",
            },
          ]
        );
        error.name = 'Validation error';
        throw error;
      }
    },

    /**
     * Validate coupon list isValid should provide totalAmount
     *
     * @param {Coupon} params
     */
    couponListValidation(params): void {
      if (params.isValid && !params.totalAmount && params.totalAmount !== 0) {
        const error = new MoleculerError(
          'Parameters validation error!',
          422,
          'VALIDATION_ERROR',
          [
            {
              type: 'number',
              expected: {
                totalAmount: 'number',
              },
              actual: params.totalAmount,
              field: 'totalAmount',
              message: "The 'totalAmount' field is required!",
            },
          ]
        );
        error.name = 'Validation error';
        throw error;
      }
    },
  },
};

export = TheService;
