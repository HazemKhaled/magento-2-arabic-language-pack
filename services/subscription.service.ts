import { Context, Errors, ServiceSchema } from 'moleculer';
import { isError } from 'util';
import DbService from '../utilities/mixins/mongo.mixin';
import { SubscriptionOpenapi } from '../utilities/mixins/openapi';
import { Coupon, Membership, Store, Subscription } from '../utilities/types';
import { SubscriptionValidation } from '../utilities/mixins/validation';
import TaxCheck from '../utilities/mixins/tax.mixin';
const MoleculerError = Errors.MoleculerError;

const TheService: ServiceSchema = {
  name: 'subscription',
  mixins: [DbService('subscription'), SubscriptionValidation, SubscriptionOpenapi, TaxCheck],

  actions: {
    /**
     * Get Subscription for collection of users
     *
     * @param {string} url
     * @returns {Promise<Subscription | false>}
     */
    get: {
      cache: {
        keys: ['id'],
        ttl: 60 * 60 * 24, // 1 day
      },
      async handler(ctx: Context): Promise<any | false> {
        const subscription =
          (await this.adapter.findOne({
            storeId: ctx.params.id,
            expireDate: { $gte: new Date() },
            startDate: { $lte: new Date() },
          })) || {};
        const membership = await ctx.call('membership.get', {
          id: subscription.membershipId || 'free',
        });
        return {
          id: (subscription._id && subscription._id.toString()) || -1,
          ...subscription,
          membershipId: undefined,
          membership: {
            id: membership.id,
            name: membership.name,
            sort: membership.sort,
            isDefault: membership.isDefault,
            paymentFrequencyType: membership.paymentFrequencyType,
          },
          _id: undefined,
          storeId: undefined,
          attributes: membership.attributes,
        };
      },
    },
    sList: {
      auth: 'Basic',
      cache: {
        keys: ['storeId', 'membershipId', 'expireDate', 'startDate', 'page', 'perPage', 'sort'],
        ttl: 60 * 60 * 24, // 1 day
      },
      async handler(ctx: Context): Promise<Subscription | false> {
        const query: { [key: string]: any } = {};
        if (ctx.params.storeId) {
          query.storeId = ctx.params.storeId;
        }
        if (ctx.params.membershipId) {
          query.membershipId = ctx.params.membershipId;
        }
        if (ctx.params.expireDate) {
          const expireDate = Array.isArray(ctx.params.expireDate)
            ? ctx.params.expireDate
            : [ctx.params.expireDate];
          query.expireDate = {
            [`$${expireDate[0].operation}`]: expireDate[0].date
              ? new Date(expireDate[0].date)
              : new Date(),
          };
          if (expireDate[1]) {
            query.expireDate[`$${expireDate[1].operation}`] = expireDate[1].date
              ? new Date(expireDate[1].date)
              : new Date();
          }
        }
        if (ctx.params.startDate) {
          const startDate = Array.isArray(ctx.params.startDate)
            ? ctx.params.startDate
            : [ctx.params.startDate];
          query.startDate = {
            [`$${startDate[0].operation}`]: startDate[0].date
              ? new Date(startDate[0].date)
              : new Date(),
          };
          if (startDate[1]) {
            query.startDate[`$${startDate[1].operation}`] = startDate[1].date
              ? new Date(startDate[1].date)
              : new Date();
          }
        }
        const findBody: any = { query };
        if (ctx.params.sort) {
          findBody.sort = { [ctx.params.sort.field]: ctx.params.sort.order };
        }
        if (ctx.params.perPage) {
          findBody.limit = ctx.params.perPage;
        }
        findBody.offset = (findBody.limit || 100) * (ctx.params.page ? ctx.params.page - 1 : 0);
        return this.adapter
          .find(findBody)
          .then((res: Subscription[]) => {
            return res;
          })
          .catch((err: any) => {
            if (err.name === 'MoleculerError') {
              throw new MoleculerError(err.message, err.code);
            }
            throw new MoleculerError(err, 500);
          });
      },
    },
    create: {
      auth: 'Basic',
      async handler(ctx: Context) {
        let coupon: Coupon = null;
        if (ctx.params.coupon) {
          coupon = await ctx
            .call('coupons.get', {
              id: ctx.params.coupon,
              membership: ctx.params.membership,
              type: 'subscription',
            })
            .then(null, err => err);
          if (isError(coupon)) {
            throw new MoleculerError(coupon.message, Number(coupon.code));
          }
        }
        const membership = await ctx
          .call('membership.get', { id: ctx.params.membership })
          .then(null, err => err);
        if (isError(membership as { message: string; code: number })) {
          throw new MoleculerError(membership.message, membership.code || 500);
        }
        if (!membership) {
          throw new MoleculerError('No membership found', 404);
        }
        if (membership.isDefault) {
          throw new MoleculerError('Could not create subscription for default memberships!', 405);
        }
        const cost = membership.cost;
        let discount = 0;
        if (coupon) {
          switch (coupon.discount.total.type) {
          case '$':
            discount = Math.min(coupon.discount.total.value, cost);
            break;
          case '%':
            discount = +((cost / 100) * coupon.discount.total.value).toFixed(2);
            break;
          }
        }
        discount = Math.max(discount, membership.discount);
        const instance = await ctx
          .call('stores.sGet', { id: ctx.params.storeId })
          .then(null, err => err);
        if (isError(instance as { message: string; code: number })) {
          throw new MoleculerError(instance.message, instance.code || 500);
        }
        if (instance.errors) {
          throw new MoleculerError(instance.errors[0].message, 404);
        }

        const taxData = await this.getTaxWithCalc(instance, { taxClass: 'service', rate: cost });
        const tax = taxData.value;

        if (instance.credit < cost + tax - discount) {
          const total = +(cost + (taxData.value || 0) - discount).toFixed(2);
          if (instance.credit < total) {
            await ctx.call('payments.charge', {
              storeId: instance.url,
              amount: total - instance.credit,
              force: true,
            });
          }
        }

        const invoiceBody: { [key: string]: any } = {
          storeId: ctx.params.storeId,
          items: [
            {
              sku: membership.id,
              name: `${membership.name.en} subscription ${membership.paymentFrequency} ${
                membership.paymentFrequencyType
              }`,
              accountId: String(process.env.SUBSCRIPTION_LEDGER_ACCOUNT_ID),
              rate: cost,
              quantity: 1,
              taxId: taxData.omsId,
            },
          ],
          isInclusiveTax: taxData.isInclusive,
        };

        if (discount) {
          invoiceBody.discount = {
            value: discount,
            type: 'entity_level',
          };
        }

        const invoice = await ctx.call('invoices.create', invoiceBody).then(null, err => err);
        if (isError(invoice as { message: string; code: number })) {
          throw new MoleculerError(invoice.message, invoice.code || 500);
        }
        ctx.meta.user = instance.consumer_key;
        const applyCreditsResponse = await ctx
          .call('invoices.applyCredits', {
            id: invoice.invoice.invoiceId,
          })
          .then(null, err => err);
        if (isError(applyCreditsResponse as { message: string; code: number })) {
          throw new MoleculerError(applyCreditsResponse.message, applyCreditsResponse.code || 500);
        }
        const storeOldSubscription = await ctx.call('subscription.sList', {
          storeId: ctx.params.storeId,
          expireDate: { operation: 'gte' },
        });
        let startDate = new Date();
        startDate.setUTCHours(0, 0, 0, 0);
        if (storeOldSubscription.length > 0) {
          storeOldSubscription.forEach((subscription: Subscription) => {
            startDate =
              new Date(subscription.expireDate) > startDate
                ? new Date(new Date(subscription.expireDate).setMilliseconds(1000))
                : startDate;
          });
        }
        const expireDate = new Date(startDate);
        expireDate.setMilliseconds(-1);
        switch (membership.paymentFrequencyType) {
        case 'month':
          expireDate.setMonth(expireDate.getMonth() + membership.paymentFrequency);
          break;
        case 'year':
          expireDate.setFullYear(expireDate.getFullYear() + membership.paymentFrequency);
          break;
        }
        if (ctx.params.coupon) {
          ctx.call('coupons.updateCount', {
            id: ctx.params.coupon,
          });
        }
        return this.adapter
          .insert({
            membershipId: membership.id,
            storeId: ctx.params.storeId,
            invoiceId: invoice.invoice.invoiceId,
            startDate,
            expireDate,
          })
          .then(
            (res: Subscription): {} => {
              this.broker.cacher.clean(`subscription.get:${instance.url}*`);
              this.broker.cacher.clean(`subscription.sList:${instance.url}*`);
              this.broker.cacher.clean(`stores.sGet:${instance.url}*`);
              this.broker.cacher.clean(`stores.me:${instance.consumer_key}*`);
              ctx.call('subscription.checkCurrentSubGradingStatus', {
                id: ctx.params.storeId,
              });
              ctx.call('crm.updateStoreById', { id: ctx.params.storeId, membership_id: membership.id, subscription_expiration: expireDate.getTime() });
              return { ...res, id: res._id, _id: undefined };
            },
          );
      },
    },
    getSubscriptionByExpireDate: {
      cache: false,
      async handler(ctx: Context) {
        const minDate = new Date();
        minDate.setDate(minDate.getDate() - ctx.params.days);
        const lastRetryDay = new Date();
        lastRetryDay.setUTCHours(0, 0, 0, 0);
        const query = {
          expireDate: {
            $gte: minDate,
            $lte: new Date(),
          },
          retries: {
            $ne: lastRetryDay,
          },
          renewed: {
            $ne: true,
          },
          autoRenew: {
            $ne: false,
          },
        };
        const expiredSubscription = await this.adapter.findOne(query).catch();
        if (!expiredSubscription) {
          return null;
        }
        expiredSubscription._id = expiredSubscription._id.toString();
        const currentSubscription = await ctx.call('subscription.get', {
          id: expiredSubscription.storeId,
        });
        if (currentSubscription.id !== -1) {
          await ctx.call('subscription.updateSubscription', {
            id: expiredSubscription._id,
            renewed: true,
          });
          ctx.call('crm.addTagsByUrl', {
            id: expiredSubscription.storeId,
            tag: 'subscription-renew',
          });
          return ctx.call('subscription.getSubscriptionByExpireDate', { days: ctx.params.days });
        }
        const date = new Date();
        date.setUTCHours(0, 0, 0, 0);
        ctx.call('subscription.updateSubscription', {
          id: expiredSubscription._id,
          retries: expiredSubscription.retries
            ? [...expiredSubscription.retries, new Date(date)]
            : [new Date(date)],
        });
        ctx.call('crm.addTagsByUrl', {
          id: expiredSubscription.storeId,
          tag: 'subscription-retry-fail',
        });
        return { ...expiredSubscription, id: expiredSubscription._id };
      },
    },
    updateSubscription: {
      auth: 'Basic',
      handler(ctx: Context) {
        let $set: { [key: string]: string } = {};
        const { params } = ctx;
        if (ctx.params.retries) {
          $set.retries = ctx.params.retries.map((i: Date) => new Date(i));
        }
        if (ctx.params.startDate) {
          params.startDate = new Date(params.startDate);
        }
        if (ctx.params.expireDate) {
          params.expireDate = new Date(params.expireDate);
        }
        $set = { ...params, ...$set };
        delete $set.id;
        return this.adapter
          .updateById(ctx.params.id, { $set })
          .then((instance: Store) => {
            this.broker.cacher.clean(`subscription.get:${instance.url}*`);
            this.broker.cacher.clean(`subscription.sList:${instance.url}*`);
            this.broker.cacher.clean(`stores.sGet:${instance.url}*`);
            this.broker.cacher.clean(`stores.me:${instance.consumer_key}*`);
            return instance;
          })
          .catch((err: any) => {
            throw new MoleculerError(err, 500);
          });
      },
    },
    checkCurrentSubGradingStatus: {
      async handler(ctx: Context) {
        const allSubBefore = await ctx.call('subscription.sList', {
          storeId: ctx.params.id,
          expireDate: { operation: 'gte', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) },
          sort: { field: 'expireDate', order: -1 },
          perPage: 2,
        });
        const memberships = await ctx.call('membership.list');
        if (allSubBefore.length === 0) return;
        if (allSubBefore.length === 1) {
          return ctx.call('crm.addTagsByUrl', {
            id: ctx.params.id,
            tag: 'subscription-upgrade',
          });
        }
        const oldM = memberships.find((m: Membership) => allSubBefore[0].membershipId === m.id);
        const lastM = memberships.find((m: Membership) => allSubBefore[1].membershipId === m.id);
        if (oldM.sort > lastM.sort) {
          return ctx.call('crm.addTagsByUrl', {
            id: ctx.params.id,
            tag: 'subscription-upgrade',
          });
        }
        if (oldM.sort < lastM.sort) {
          return ctx.call('crm.addTagsByUrl', {
            id: ctx.params.id,
            tag: 'subscription-downgrade',
          });
        }
      },
    },
  },
};

export = TheService;
