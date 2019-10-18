import Moleculer, { Context, ServiceSchema } from 'moleculer';
import { isError } from 'util';
import DbService from '../utilities/mixins/mongo.mixin';
import { Coupon, StoreUser, Subscription, User } from '../utilities/types';
import { CreateSubscriptionValidation } from '../utilities/validations';
// tslint:disable-next-line:no-var-requires
const { MoleculerError } = require('moleculer').Errors;


const TheService: ServiceSchema = {
    name: 'subscription',
    mixins: [DbService('subscription')],

    actions: {
        /**
         * Get Subscription for collection of users
         *
         * @param {string} url
         * @returns {Promise<Subscription | false>}
         */
        get: {
            params: {
                id: {type: 'string'}
            },
            cache: {
                keys: ['id'],
                ttl: 60 * 60 // 1 hour
            },
            async handler(ctx: Context): Promise<any | false> {
                const subscription = await this.adapter.findOne({storeId: ctx.params.id, expireDate: {$gte: new Date()}, startDate: {$lte: new Date()}});
                const membership = await ctx.call('membership.get', {id: subscription ? subscription.membershipId : 'free'});
                return {id: subscription._id, ...subscription, _id: undefined, storeId: undefined, ...membership.attributes};
            }
        },
        list: {
            params: {
                id: {type: 'string'}
            },
            cache: {
                keys: ['id'],
                ttl: 60 * 60 // 1 hour
            },
            async handler(ctx: Context): Promise<Subscription | false> {
                return this.adapter
                    .find({query: {storeId: ctx.params.id, expireDate: { $gte: new Date() }}})
                    .then((res: Subscription[]) => {
                        return res;
                    })
                    .catch((err: any) => {
                        if (err.name === 'MoleculerError') {
                            throw new MoleculerError(err.message, err.code);
                        }
                        throw new MoleculerError(err, 500);
                    });
            }
        },
        create: {
            auth: 'Basic',
            params: CreateSubscriptionValidation,
            async handler(ctx: Context) {
                let coupon: Coupon = null;
                if(ctx.params.coupon) {
                    coupon = await ctx.call('coupons.get', {
                        id: ctx.params.coupon,
                        membership: ctx.params.membership
                    }).then(null, err => err);
                    if(isError(coupon)) {
                        throw new MoleculerError(coupon.message, coupon.code);
                    }
                }
                const membership = await ctx.call('membership.get', { id: ctx.params.membership }).then(null, err => err);
                if(isError(membership as {message: string; code: number})) {
                    throw new MoleculerError(membership.message, membership.code || 500);
                }
                if(!membership) {
                    throw new MoleculerError('No membership found', 404);
                }
                let cost  = membership.cost;
                let discount = 0;
                if(coupon ) {
                    switch (coupon.discountType) {
                        case '$':
                            discount = cost > coupon.discount ? cost - coupon.discount : 0
                            break;
                        case '%':
                            discount = cost - cost * coupon.discount/100
                            break;
                    }
                }
                discount = discount > membership.discount ? discount : membership.discount;
                cost = cost - discount;
                const instance = await ctx.call('stores.get', { id: ctx.params.storeId }).then(null, err => err);
                if(isError(instance as {message: string; code: number})) {
                    throw new MoleculerError(instance.message, instance.code || 500);
                }
                if(instance.errors) {
                    throw new MoleculerError(instance.errors[0].message, 404);
                }

                if(instance.credits < cost) {
                    throw new MoleculerError('User don\'t have enough balance!', 402);
                }
                const invoice = await ctx.call('invoices.create', {
                    storeId: ctx.params.storeId,
                    items: [{
                        sku: membership.id,
                        name: membership.name.en,
                        description: membership.description.en,
                        rate: cost,
                        quantity: 1,
                    }]
                }).then(null, err => err);
                if(isError(invoice as {message: string; code: number})) {
                    throw new MoleculerError(invoice.message, invoice.code || 500);
                }
                ctx.meta.user = instance.consumer_key;
                const applyCreditsResponse = await ctx.call('invoices.applyCredits', {
                    id: invoice.invoice.invoiceId
                }).then(null, err => err);
                if(isError(applyCreditsResponse as {message: string; code: number})) {
                    throw new MoleculerError(applyCreditsResponse.message, applyCreditsResponse.code || 500);
                }
                const storeOldSubscription = await ctx.call('subscription.list', {
                    id: ctx.params.storeId
                });
                let startDate = new Date();
                startDate.setUTCHours(0,0,0,0);
                if(storeOldSubscription.length > 0) {
                    storeOldSubscription.forEach((subscription: Subscription) => {
                        startDate = new Date(subscription.expireDate) > startDate ? new Date(subscription.expireDate) : startDate;
                    });
                }
                const expireDate = new Date(startDate);
                switch (membership.paymentFrequencyType) {
                    case 'month':
                        expireDate.setDate(expireDate.getDate() + 30);
                        break;
                    case 'year':
                        expireDate.setFullYear(expireDate.getFullYear() + 30);
                        break;
                }
                ctx.call('coupons.updateCount', {
                    id: ctx.params.coupon
                });
                return this.adapter.insert({
                    membershipId: membership.id,
                    storeId: ctx.params.storeId,
                    invoiceId: invoice.invoice.invoiceId,
                    startDate,
                    expireDate
                }).then((res: Subscription): {} => ({...res, id: res._id, _id: undefined}));
            }
        }
    }
};

export = TheService;
