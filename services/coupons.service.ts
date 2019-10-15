import { Context, ServiceSchema } from 'moleculer';
import DbService from '../utilities/mixins/mongo.mixin';
import { Coupon } from '../utilities/types';
import { CreateCouponValidation, UpdateCouponValidation } from '../utilities/validations';

// tslint:disable-next-line:no-var-requires
const { MoleculerError } = require('moleculer').Errors;

const TheService: ServiceSchema = {
    name: 'coupons',
    mixins: [DbService('coupons')],
    actions: {
        create: {
            auth: 'Basic',
            params: CreateCouponValidation,
            handler(ctx: Context): Promise<Coupon> {
                ctx.params._id = ctx.params.code;
                delete ctx.params.code;
                ctx.params.useCount = 0;
                ctx.params.startDate = new Date(ctx.params.startDate);
                ctx.params.endDate = new Date(ctx.params.endDate);
                return this.adapter
                    .insert(ctx.params)
                    .then((res: Coupon) => this.normalizeId(res))
                    .catch((err: any) => {
                        if (err.name === 'MoleculerError') {
                            throw new MoleculerError(err.message, err.code);
                        }
                        throw new MoleculerError(err, 500);
                    });
            }
        },
        get: {
            auth: 'Basic',
            params: {
                id: [{ type: 'string' }, { type: 'number' }],
                membership: { type: 'string' }
            },
            handler(ctx: Context): Promise<Coupon> {
                return this.adapter
                    .findOne({ _id: ctx.params.id, appliedMemberships: ctx.params.membership, startDate: { $lte: new Date() }, endDate: { $gte: new Date() } })
                    .then((res: Coupon) => {
                        if (!res) {
                            throw new MoleculerError('No Coupon found for this ID or Membership', 404);
                        }
                        if(res.maxUses <= res.useCount) {
                            throw new MoleculerError("Coupon exceeded maximum usage!", 403)
                        }
                        return this.normalizeId(res);
                    })
                    .catch((err: any) => {
                        if (err.name === 'MoleculerError') {
                            throw new MoleculerError(err.message, err.code);
                        }
                        throw new MoleculerError(err, 500);
                    });
            }
        },
        list: {
            auth: 'Basic',
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
            }
        },
        update: {
            auth: 'Basic',
            params: UpdateCouponValidation,
            async handler(ctx: Context): Promise<Coupon> {
                const coupon = await this.adapter.updateById(ctx.params.id, { $set: ctx.params }).catch((err: any) => {
                    throw new MoleculerError(err, 500);
                });
                if (!coupon) {
                    throw new MoleculerError('No Coupons found!', 404);
                }

                return coupon;
            }
        },
        updateCount: {
            auth: 'Basic',
            params: {
                id: { type: 'string' }
            },
            async handler(ctx: Context) {
                const coupon = await this.adapter.updateById(ctx.params.id, { $inc: { useCount: 1 } }).catch((err: any) => {
                    throw new MoleculerError(err, 500);
                });
                if (!coupon) {
                    throw new MoleculerError('No Coupons found!', 404);
                }
                return coupon;
            }
        }
    },
    methods: {
        /**
         * Convert object _id to id
         *
         * @param {{_id: string, id?: string}} obj
         * @returns
         */
        normalizeId(obj: { _id: string; code?: string }) {
            obj.code = obj._id;
            delete obj._id;
            return obj;
        }
    }
};

export = TheService;
