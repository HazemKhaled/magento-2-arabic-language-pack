import { types } from 'util';

import { Context, Errors, GenericObject, ServiceSchema } from 'moleculer';

import DbService from '../utilities/mixins/mongo.mixin';
import { SubscriptionOpenapi } from '../utilities/mixins/openapi';
import {
  Coupon,
  Membership,
  Subscription,
  Store,
  MetaParams,
  Payment,
  Invoice,
  CrmStore,
  CommonError,
} from '../utilities/types';
import { SubscriptionValidation } from '../utilities/mixins/validation';
import { TaxCheck } from '../utilities/mixins/tax.mixin';
import { MpError } from '../utilities/adapters';

const { isNativeError } = types;

const MoleculerError = Errors.MoleculerError;

const TheService: ServiceSchema = {
  name: 'subscription',
  mixins: [
    DbService('subscription'),
    SubscriptionValidation,
    SubscriptionOpenapi,
    TaxCheck,
  ],

  actions: {
    /**
     * Get Subscription for collection of users
     *
     * @param {string} url
     * @returns {Promise<Subscription | false>}
     */
    sGet: {
      cache: {
        keys: ['id'],
        ttl: 60 * 60 * 24,
      },
      async handler(ctx: Context<Subscription>): Promise<any | false> {
        const subscription =
          (await this.adapter.findOne({
            storeId: ctx.params.id,
            status: { $ne: 'cancelled' },
            expireDate: { $gte: new Date() },
            startDate: { $lte: new Date() },
          })) || {};
        const membership: Membership = await ctx.call<
          Membership,
          Partial<Membership>
        >('membership.mGet', {
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
      auth: ['Basic'],
      cache: {
        keys: [
          'storeId',
          'membershipId',
          'reference',
          'expireDate',
          'startDate',
          'status',
          'page',
          'perPage',
          'sort',
        ],
        ttl: 60 * 60 * 24,
      },
      async handler(ctx: Context<Subscription>): Promise<Subscription | false> {
        const query: GenericObject = {};
        if (ctx.params.storeId) {
          query.storeId = ctx.params.storeId;
        }
        if (ctx.params.membershipId) {
          query.membershipId = ctx.params.membershipId;
        }
        if (ctx.params.status) {
          query.status =
            ctx.params.status === 'active'
              ? { $ne: 'cancelled' }
              : ctx.params.status;
        }
        if (ctx.params.reference) {
          query.reference = ctx.params.reference;
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
          findBody.limit = Number(ctx.params.perPage);
        }
        findBody.offset =
          (findBody.limit || 100) *
          (ctx.params.page ? Number(ctx.params.page) - 1 : 0);
        return this.adapter
          .find(findBody)
          .then((res: Subscription[]) => {
            return res;
          })
          .catch((err: CommonError) => {
            if (err.name === 'MoleculerError') {
              throw new MoleculerError(err.message, err.code);
            }
            throw new MoleculerError(String(err), 500);
          });
      },
    },
    create: {
      auth: ['Basic'],
      async handler(ctx: Context<Subscription, MetaParams>): Promise<unknown> {
        let coupon: Coupon = null;
        if (ctx.params.coupon) {
          coupon = await ctx
            .call<Coupon, Partial<Coupon>>('coupons.get', {
              id: ctx.params.coupon,
              membership: ctx.params.membership,
              type: 'subscription',
            })
            .then(null, err => err);
          if (isNativeError(coupon)) {
            throw new MoleculerError(coupon.message, Number(coupon.code));
          }
        }

        const membershipRequestBody: {
          id: string;
          active: true;
          coupon?: string;
        } = { id: ctx.params.membership, active: true };
        if (ctx.params.coupon) {
          membershipRequestBody.coupon = ctx.params.coupon;
        }
        const membership = await ctx
          .call<Membership, Partial<Membership>>(
            'membership.mGet',
            membershipRequestBody
          )
          .then(null, err => err);
        if (isNativeError(membership as { message: string; code: number })) {
          throw new MoleculerError(membership.message, membership.code || 500);
        }
        if (!membership) {
          throw new MoleculerError('No membership found', 404);
        }
        if (membership.isDefault) {
          throw new MoleculerError(
            'Could not create subscription for default memberships!',
            405
          );
        }

        // Membership cost before tax or discount
        const cost = membership.cost;

        const discount = membership.discount;

        // Get the Store instance
        const instance: Store = await ctx
          .call<Store, Partial<Store>>('stores.sGet', {
            id: ctx.params.storeId,
          })
          .then(null, err => err);
        let grantToInstance: Store | null = null;
        if (ctx.params.grantTo) {
          grantToInstance = await ctx.call<Store, Partial<Store>>(
            'stores.findInstance',
            {
              id: ctx.params.grantTo,
            }
          );
        }

        // Check for instance errors
        if (instance.errors) {
          throw new MoleculerError(instance.errors[0].message, 404);
        }

        if (isNativeError(instance as { message: string; code: number })) {
          throw new MoleculerError(instance.message, instance.code || 500);
        }
        let total = Number((cost - discount).toFixed(2));

        // Get taxes info
        const taxData = await this.getTaxWithCalc(instance, {
          taxClass: 'service',
          rate: cost,
        });
        if (taxData.value) {
          total = Number(
            (total + (total * taxData.percentage) / 100).toFixed(2)
          );
        }

        if (instance.credit < total && !ctx.params.postpaid) {
          if (process.env.PAYMENT_AUTO_CHARGE_CC_SUBSCRIPTION) {
            await ctx
              .call<GenericObject, Partial<Payment>>('paymentGateway.charge', {
                storeId: instance.url,
                amount: total - instance.credit,
                description: `${membership.name?.en} subscription ${
                  membership.paymentFrequencyType
                }ly renewal ${ctx.params.grantTo || ctx.params.storeId}`,
                force: true,
              })
              .then(null, err => {
                if (err.type === 'SERVICE_NOT_FOUND')
                  throw new MpError(
                    'Subscription Service',
                    "You don't have enough balance",
                    402
                  );
                throw err;
              });
          } else {
            throw new MpError(
              'Subscription Service',
              "You don't have enough balance",
              402
            );
          }
        }

        const invoiceBody: GenericObject = {
          storeId: ctx.params.storeId,
          items: [
            {
              sku: membership.id,
              name: `${membership.name.en} subscription ${membership.paymentFrequency} ${membership.paymentFrequencyType}`,
              accountId: String(process.env.SUBSCRIPTION_LEDGER_ACCOUNT_ID),
              rate: cost,
              quantity: 1,
              taxId: taxData.omsId,
              description: `StoreId: ${ctx.params.storeId}${
                ctx.params.grantTo ? ` Granted To: ${ctx.params.grantTo}` : ''
              }`,
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

        if (coupon) {
          invoiceBody.coupon = coupon.campaignName
            ? `${coupon.code}-${coupon.campaignName}`
            : coupon.code;
        }

        if (ctx.params.dueDate) {
          invoiceBody.dueDate = ctx.params.dueDate;
        }

        ctx.meta.user = instance.consumer_key;

        // Apply credits to invoice if the total not equal to 0
        let invoice: Invoice = null;
        if (total !== 0 && !ctx.params.postpaid) {
          invoice = await ctx
            .call<Invoice, Partial<Invoice>>('invoices.create', invoiceBody)
            .then(null, err => err);
          if (isNativeError(invoice as { message: string; code: number })) {
            throw new MoleculerError(invoice.message, invoice.code || 500);
          }
          const applyCreditsResponse = await ctx
            .call<Invoice, Partial<Invoice>>('invoices.applyCredits', {
              id: invoice.invoice.invoiceId,
            })
            .then(null, err => err);
          if (
            isNativeError(
              applyCreditsResponse as { message: string; code: number }
            )
          ) {
            throw new MoleculerError(
              applyCreditsResponse.message,
              applyCreditsResponse.code || 500
            );
          }
        }

        let startDate = new Date();
        let expireDate = new Date();

        if (ctx.params.date) {
          startDate = new Date(ctx.params.date.start);
          expireDate = new Date(ctx.params.date.expire);
        } else {
          const storeOldSubscription: GenericObject = await ctx.call<
            GenericObject,
            Partial<Subscription>
          >('subscription.sList', {
            storeId: ctx.params.grantTo || ctx.params.storeId,
            expireDate: { operation: 'gte' },
            status: 'active',
          });
          startDate.setUTCHours(0, 0, 0, 0);
          if (storeOldSubscription.length > 0) {
            storeOldSubscription.forEach((subscription: Subscription) => {
              startDate =
                new Date(subscription.expireDate) > startDate
                  ? new Date(
                      new Date(subscription.expireDate).setMilliseconds(1000)
                    )
                  : startDate;
            });
          }
          expireDate = new Date(startDate);
          expireDate.setMilliseconds(-1);
          switch (membership.paymentFrequencyType) {
            case 'month':
              expireDate.setMonth(
                expireDate.getMonth() + membership.paymentFrequency
              );
              break;
            case 'year':
              expireDate.setFullYear(
                expireDate.getFullYear() + membership.paymentFrequency
              );
              break;
          }
        }

        const subscriptionBody: Subscription = {
          membershipId: membership.id,
          storeId: ctx.params.storeId,
          invoiceId: invoice?.invoice.invoiceId || null,
          status: 'confirmed',
          startDate,
          expireDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        if (ctx.params.coupon) {
          ctx.call<GenericObject, Partial<Coupon>>('coupons.updateCount', {
            id: ctx.params.coupon,
          });
          subscriptionBody.coupon = ctx.params.coupon;
        }

        if (ctx.params.grantTo) {
          subscriptionBody.storeId = ctx.params.grantTo;
          subscriptionBody.donor = ctx.params.storeId;
        }

        if (ctx.params.autoRenew !== undefined) {
          subscriptionBody.autoRenew = ctx.params.autoRenew;
        }

        if (ctx.params.reference) {
          subscriptionBody.reference = ctx.params.reference;
        }

        if (ctx.params.postpaid) {
          subscriptionBody.status = 'pending';
        }

        return this.adapter.insert(subscriptionBody).then(
          async (res: Subscription): Promise<GenericObject> => {
            this.broker.cacher.clean(
              `subscription.sGet:${ctx.params.grantTo || instance.url}*`
            );
            this.broker.cacher.clean(
              `subscription.sList:${ctx.params.grantTo || instance.url}*`
            );
            this.broker.cacher.clean(
              `stores.sGet:${ctx.params.grantTo || instance.url}*`
            );
            this.broker.cacher.clean(`stores.me:${instance.consumer_key}*`);
            if (ctx.params.grantTo) {
              this.broker.cacher.clean(`stores.sGet:${instance.url}*`);
              this.broker.cacher.clean(
                `stores.me:${grantToInstance?.consumer_key}*`
              );
            }
            ctx.call<GenericObject, Partial<Subscription>>(
              'subscription.checkCurrentSubGradingStatus',
              {
                id: ctx.params.grantTo || ctx.params.storeId,
              }
            );
            ctx.call<GenericObject, Partial<Store>>('crm.updateStoreById', {
              id: ctx.params.grantTo || ctx.params.storeId,
              membership_id: membership.id,
              subscription_expiration: expireDate.getTime(),
            });
            return { ...res, id: res._id, _id: undefined };
          }
        );
      },
    },
    getSubscriptionByExpireDate: {
      cache: false,
      async handler(ctx: Context<Subscription>): Promise<Subscription> {
        const minDate = new Date();
        minDate.setDate(minDate.getDate() - (ctx.params.afterDays || 0));
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + (ctx.params.beforeDays || 0));
        const lastRetryDay = new Date();
        lastRetryDay.setUTCHours(0, 0, 0, 0);
        const query: GenericObject = {
          expireDate: {
            $gte: minDate,
            $lte: maxDate,
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
          status: { $ne: 'cancelled' },
        };
        let expiredSubscription = await this.adapter
          .findOne(query)
          .catch(console.error);
        if (!expiredSubscription) {
          return null;
        }
        query.storeId = expiredSubscription.storeId;
        [expiredSubscription] = await this.adapter.find({
          query,
          sort: { expireDate: -1 },
        });
        expiredSubscription._id = expiredSubscription._id.toString();
        const currentSubscription: Subscription = await ctx.call<
          Subscription,
          Partial<Subscription>
        >('subscription.sGet', {
          id: expiredSubscription.storeId,
        });
        if (currentSubscription.id !== -1) {
          await ctx.call<GenericObject, Partial<Subscription>>(
            'subscription.updateSubscription',
            {
              id: expiredSubscription._id,
              renewed: true,
            }
          );
          ctx.call<GenericObject, Partial<CrmStore>>('crm.addTagsByUrl', {
            id: expiredSubscription.storeId,
            tag: 'subscription-renew',
          });
          return ctx.call<GenericObject, Partial<Subscription>>(
            'subscription.getSubscriptionByExpireDate',
            {
              afterDays: ctx.params.afterDays,
              beforeDays: ctx.params.beforeDays,
            }
          );
        }
        const date = new Date();
        date.setUTCHours(0, 0, 0, 0);
        ctx.call<GenericObject, Partial<Subscription>>(
          'subscription.updateSubscription',
          {
            id: expiredSubscription._id,
            retries: expiredSubscription.retries
              ? [...expiredSubscription.retries, new Date(date)]
              : [new Date(date)],
          }
        );
        ctx.call<GenericObject, Partial<CrmStore>>('crm.addTagsByUrl', {
          id: expiredSubscription.storeId,
          tag: 'subscription-retry-fail',
        });
        return { ...expiredSubscription, id: expiredSubscription._id };
      },
    },
    updateSubscription: {
      auth: ['Basic'],
      handler(ctx: Context<any>): Promise<Subscription> {
        let $set: Partial<Subscription> = {};
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
        $set = { ...params, ...$set, updatedAt: new Date() };
        delete $set.id;
        return this.adapter
          .updateById(ctx.params.id, { $set })
          .then(async (subscription: Subscription) => {
            const store: Store = await ctx.call<Store, Partial<Store>>(
              'stores.findInstance',
              {
                id: subscription.storeId,
              }
            );

            this.broker.cacher.clean(`subscription.sGet:${store.url}**`);
            this.broker.cacher.clean(`subscription.sList:${store.url}**`);
            this.broker.cacher.clean(`stores.sGet:${store.url}**`);
            this.broker.cacher.clean(`stores.me:${store.consumer_key}**`);
            return subscription;
          })
          .catch((err: CommonError) => {
            throw new MoleculerError(String(err), 500);
          });
      },
    },
    checkCurrentSubGradingStatus: {
      async handler(ctx: Context<Subscription>) {
        const allSubBefore = await ctx.call<
          GenericObject,
          Partial<Subscription>
        >('subscription.sList', {
          storeId: ctx.params.id,
          expireDate: {
            operation: 'gte',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          },
          status: 'active',
          sort: { field: 'expireDate', order: -1 },
          perPage: 2,
        });
        const memberships: GenericObject = await ctx.call<GenericObject>(
          'membership.list'
        );
        if (allSubBefore.length === 0) return;
        if (allSubBefore.length === 1) {
          return ctx.call<GenericObject, Partial<CrmStore>>(
            'crm.addTagsByUrl',
            {
              id: ctx.params.id,
              tag: 'subscription-upgrade',
            }
          );
        }
        const oldM = memberships.find(
          (m: Membership) => allSubBefore[0].membershipId === m.id
        );
        const lastM = memberships.find(
          (m: Membership) => allSubBefore[1].membershipId === m.id
        );
        if (oldM.sort > lastM.sort) {
          return ctx.call<GenericObject, Partial<CrmStore>>(
            'crm.addTagsByUrl',
            {
              id: ctx.params.id,
              tag: 'subscription-upgrade',
            }
          );
        }
        if (oldM.sort < lastM.sort) {
          return ctx.call<GenericObject, Partial<CrmStore>>(
            'crm.addTagsByUrl',
            {
              id: ctx.params.id,
              tag: 'subscription-downgrade',
            }
          );
        }
      },
    },
    cancel: {
      auth: ['Basic'],
      handler(ctx): Promise<Subscription> {
        return this.adapter
          .updateById(ctx.params.id, { $set: { status: 'cancelled' } })
          .then(async (res: any) => {
            const instance: Store = await ctx.call<Store, Partial<Store>>(
              'stores.findInstance',
              {
                id: res.storeId,
              }
            );

            if (res.invoiceId) {
              ctx.call<GenericObject, Partial<Invoice>>(
                'invoices.updateInvoiceStatus',
                {
                  omsId: instance?.internal_data?.omsId,
                  invoiceId: res.invoiceId,
                  status: 'void',
                }
              );
            }
            if (!res) {
              throw new MpError(
                'Subscription Service',
                'Subscription not found!',
                404
              );
            }
            this.broker.cacher.clean(`subscription.sGet:${res.storeId}*`);
            this.broker.cacher.clean(`subscription.sList:${res.storeId}*`);
            this.broker.cacher.clean(`stores.sGet:${res.storeId}*`);
            this.broker.cacher.clean(`stores.me:${instance.consumer_key}*`);
            return { ...res, id: res._id, _id: undefined };
          });
      },
    },
  },
};

export = TheService;
