import { Context, Errors, GenericObject, ServiceSchema } from 'moleculer';
import { DbContextParameters } from 'moleculer-db';

import DbService from '../utilities/mixins/mongo.mixin';
import { SubscriptionOpenapi } from '../utilities/mixins/openapi';
import {
  Coupon,
  Membership,
  Subscription,
  Store,
  MetaParams,
  Invoice,
  CommonError,
  SubscriptionListParams,
} from '../utilities/types';
import { SubscriptionValidation } from '../utilities/mixins/validation';
import { TaxCheck } from '../utilities/mixins/tax.mixin';
import { MpError } from '../utilities/adapters';

const MoleculerError = Errors.MoleculerError;

const TheService: ServiceSchema = {
  name: 'subscription',
  mixins: [
    new DbService('subscription').start(),
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
    getByStore: {
      cache: {
        keys: ['storeId'],
        ttl: 60 * 60 * 24,
      },
      async handler(
        ctx: Context<{ storeId: string }>
      ): Promise<Subscription | false> {
        const subscription = await ctx
          .call<Subscription[], GenericObject>('subscription.find', {
            query: {
              storeId: ctx.params.storeId,
              status: { $ne: 'cancelled' },
              expireDate: { $gte: new Date() },
              startDate: { $lte: new Date() },
            },
          })
          .then(([record]) => record);

        const membership = await ctx
          .call<Membership, Partial<Membership>>('membership.get', {
            id: subscription?.membershipId || 'm-free',
          })
          .then(res => {
            return this.transformMembershipEntity(res);
          });

        return {
          id: (subscription?._id && subscription?._id.toString()) || '-1',
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
    getAll: {
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
      rest: 'GET /',
      async handler(
        ctx: Context<SubscriptionListParams>
      ): Promise<Subscription[]> {
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
        const findBody: GenericObject = { query };
        if (ctx.params.sort) {
          findBody.sort =
            ctx.params.sort.order === 1
              ? ctx.params.sort.field
              : `-${ctx.params.sort.field}`;
        }
        if (ctx.params.perPage) {
          findBody.limit = Number(ctx.params.perPage);
        }
        findBody.offset =
          (findBody.limit || 100) *
          (ctx.params.page ? Number(ctx.params.page) - 1 : 0);
        return ctx
          .call<Subscription[], GenericObject>('subscription.find', findBody)
          .then(res => {
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
    createOne: {
      auth: ['Basic'],
      rest: 'POST /',
      async handler(ctx: Context<Subscription, MetaParams>): Promise<unknown> {
        let coupon: Coupon = null;
        if (ctx.params.coupon) {
          coupon = await ctx
            .call<Coupon, Partial<Coupon>>('coupons.getOne', {
              id: ctx.params.coupon,
              membership: ctx.params.membership,
              type: 'subscription',
            })
            .catch(err => {
              throw new MpError(
                'Subscription Service',
                err.code === 404
                  ? 'Coupon not found !'
                  : 'Internal Server error',
                err.code
              );
            });
        }

        const membershipRequestBody: {
          id: string;
          active: true;
        } = { id: ctx.params.membership, active: true };

        const membership = await ctx
          .call<Membership, Partial<Membership>>(
            'membership.getOne',
            membershipRequestBody
          )
          .catch(err => {
            throw new MpError(
              'Subscription Service',
              err.code === 404
                ? 'No membership found ! !'
                : 'Internal Server error',
              err.code
            );
          });

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
        const instance = await ctx
          .call<Store, { id: string }>('stores.get', {
            id: ctx.params.storeId,
          })
          .catch(err => {
            throw new MpError(
              'Subscription Service',
              err.code === 404
                ? 'Store not found ! !'
                : 'Internal Server error',
              err.code
            );
          });

        let grantToInstance: Store;
        if (ctx.params.grantTo) {
          grantToInstance = await ctx.call<Store, { id: string }>(
            'stores.get',
            { id: ctx.params.grantTo }
          );
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
              .call<GenericObject, Partial<GenericObject>>(
                'paymentGateway.charge',
                {
                  store: instance.url,
                  purchase_units: [
                    {
                      amount: {
                        value: total - instance.credit,
                        currency: 'USD',
                      },
                      description: `${membership.name?.en} subscription ${
                        membership.paymentFrequencyType
                      }ly renewal ${ctx.params.grantTo || ctx.params.storeId}`,
                    },
                  ],
                }
              )
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
              taxId: taxData.omsId || '',
              description: `StoreId: ${ctx.params.storeId}${
                ctx.params.grantTo ? ` Granted To: ${ctx.params.grantTo}` : ''
              }`,
            },
          ],
          isInclusiveTax: taxData?.isInclusive,
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
        ctx.meta.store = instance;

        // Apply credits to invoice if the total not equal to 0
        let invoice: Invoice = null;
        if (total !== 0 && !ctx.params.postpaid) {
          invoice = await ctx
            .call<Invoice, Partial<Invoice>>('invoices.create', invoiceBody)
            .catch((err: CommonError) => {
              if (err.name === 'MoleculerError') {
                throw new MpError(
                  'Subscription Service (Invoice)',
                  err.message,
                  err.code
                );
              }
              throw new MoleculerError(String(err), 500);
            });

          await ctx
            .call<Invoice, { id: string }>('invoices.applyCredits', {
              id: invoice.invoice.invoiceId,
            })
            .catch((err: CommonError) => {
              if (err.name === 'MoleculerError') {
                throw new MpError(
                  'Subscription Service (Invoice)',
                  err.message,
                  err.code
                );
              }
              throw new MoleculerError(String(err), 500);
            });
        }

        let startDate = new Date();
        let expireDate = new Date();

        if (ctx.params.date) {
          startDate = new Date(ctx.params.date.start);
          expireDate = new Date(ctx.params.date.expire);
        } else {
          const storeOldSubscription = await ctx.call<
            Subscription[],
            GenericObject
          >('subscription.find', {
            query: {
              storeId: ctx.params.grantTo || ctx.params.storeId,
              expireDate: { operation: 'gte' },
              status: 'active',
            },
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

        return ctx
          .call<Subscription, Subscription>(
            'subscription.create',
            subscriptionBody
          )
          .then(
            async (res: Subscription): Promise<GenericObject> => {
              this.broker.cacher.clean(
                `subscription.getByStore:${ctx.params.grantTo || instance.url}*`
              );
              this.broker.cacher.clean(
                `subscription.getAll:${ctx.params.grantTo || instance.url}*`
              );
              this.broker.cacher.clean(
                `stores.get:${ctx.params.grantTo || instance.url}*`
              );
              this.broker.cacher.clean(`stores.me:${instance.consumer_key}*`);
              if (ctx.params.grantTo) {
                this.broker.cacher.clean(`stores.get:${instance.url}*`);
                this.broker.cacher.clean(
                  `stores.me:${grantToInstance?.consumer_key}*`
                );
              }
              ctx.call<void, Partial<Subscription>>(
                'subscription.checkCurrentSubGradingStatus',
                {
                  id: ctx.params.grantTo || ctx.params.storeId,
                }
              );
              ctx.call<
                void,
                {
                  id: string;
                  data: {
                    membership_id: string;
                    subscription_expiration: number;
                  }[];
                  module: string;
                }
              >('crm.updateRecord', {
                id: ctx.params.grantTo || ctx.params.storeId,
                module: 'accounts',
                data: [
                  {
                    membership_id: membership.id,
                    subscription_expiration: expireDate.getTime(),
                  },
                ],
              });
              return { ...res, id: res._id, _id: undefined };
            }
          );
      },
    },
    getOneByExpireDate: {
      cache: false,
      visibility: 'public',
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
        let [expiredSubscription] = await ctx.call<
          Subscription[],
          GenericObject
        >('subscription.find', {
          query,
        });

        if (!expiredSubscription) {
          return null;
        }
        query.storeId = expiredSubscription.storeId;
        [expiredSubscription] = await ctx.call<Subscription[], GenericObject>(
          'subscription.find',
          {
            query,
            sort: '-expireDate',
          }
        );
        expiredSubscription._id = expiredSubscription._id.toString();
        const date = new Date();
        date.setUTCHours(0, 0, 0, 0);

        ctx.call<void, Partial<Subscription>>('subscription.update', {
          id: expiredSubscription._id,
          retries: expiredSubscription.retries
            ? [...expiredSubscription.retries, new Date(date)]
            : [new Date(date)],
        });

        ctx.call<void, { id: string; tag: string; module: string }>(
          'crm.addTagsToRecord',
          {
            module: 'accounts',
            id: expiredSubscription.storeId,
            tag: 'subscription-retry-fail',
          }
        );

        const currentSubscription = await ctx.call<
          Subscription,
          { storeId: string }
        >('subscription.getByStore', {
          storeId: expiredSubscription.storeId,
        });

        if (currentSubscription.id !== '-1') {
          ctx.call<void, Partial<Subscription>>('subscription.update', {
            id: expiredSubscription._id,
            renewed: true,
          });

          ctx.call<void, { id: string; tag: string; module: string }>(
            'crm.addTagsToRecord',
            {
              module: 'accounts',
              id: expiredSubscription.storeId,
              tag: 'subscription-renew',
            }
          );
          return ctx.call<Subscription, GenericObject>(
            'subscription.getOneByExpireDate',
            {
              afterDays: ctx.params.afterDays,
              beforeDays: ctx.params.beforeDays,
            }
          );
        }
        return { ...expiredSubscription, id: expiredSubscription._id };
      },
    },
    updateOne: {
      auth: ['Basic'],
      rest: 'PUT /:id',
      handler(ctx: Context<Partial<Subscription>>): Promise<Subscription> {
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

        return ctx
          .call<Subscription, Partial<Subscription>>(
            'subscription.update',
            $set
          )
          .then(async subscription => {
            const store = await ctx.call<Store, { id: string }>('stores.get', {
              id: subscription.storeId,
            });

            this.broker.cacher.clean(`subscription.getByStore:${store.url}**`);
            this.broker.cacher.clean(`subscription.getAll:${store.url}**`);
            this.broker.cacher.clean(`stores.get:${store.url}**`);
            this.broker.cacher.clean(`stores.me:${store.consumer_key}**`);
            return subscription;
          })
          .catch((err: CommonError) => {
            throw new MoleculerError(String(err), 500);
          });
      },
    },
    checkCurrentSubGradingStatus: {
      visibility: 'public',
      async handler(ctx: Context<{ id: string }>): Promise<void> {
        const allSubBefore = await ctx.call<Subscription[], GenericObject>(
          'subscription.find',
          {
            query: {
              storeId: ctx.params.id,
              expireDate: {
                operation: 'gte',
                date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
              },
              status: 'active',
            },

            sort: '-expireDate',
            limit: 2,
          }
        );

        const memberships = await ctx.call<Membership[], DbContextParameters>(
          'membership.find',
          { pageSize: 99 }
        );
        if (allSubBefore.length === 0) return;
        if (allSubBefore.length === 1) {
          ctx.call<unknown, { id: string; tag: string; module: string }>(
            'crm.addTagsToRecord',
            {
              module: 'accounts',
              id: ctx.params.id,
              tag: 'subscription-upgrade',
            }
          );

          return;
        }
        const oldM = memberships.find(
          (m: Membership) => allSubBefore[0].membershipId === m.id
        );
        const lastM = memberships.find(
          (m: Membership) => allSubBefore[1].membershipId === m.id
        );

        if (oldM.sort > lastM.sort) {
          ctx.call<unknown, { id: string; tag: string; module: string }>(
            'crm.addTagsToRecord',
            {
              module: 'accounts',
              id: ctx.params.id,
              tag: 'subscription-upgrade',
            }
          );
          return;
        }

        if (oldM.sort < lastM.sort) {
          ctx.call<unknown, { id: string; tag: string; module: string }>(
            'crm.addTagsToRecord',
            {
              module: 'accounts',
              id: ctx.params.id,
              tag: 'subscription-downgrade',
            }
          );
        }
      },
    },
    cancel: {
      auth: ['Basic'],
      rest: 'DELETE /:id',
      handler(ctx): Promise<Subscription> {
        return ctx
          .call<Subscription, Partial<Subscription>>('subscription.update', {
            id: ctx.params.id,
            status: 'cancelled',
          })
          .then(async res => {
            const instance = await ctx.call<Store, { id: string }>(
              'stores.get',
              { id: res.storeId }
            );

            if (res.invoiceId) {
              ctx.call<void, Partial<Invoice>>('invoices.updateInvoiceStatus', {
                omsId: instance?.internal_data?.omsId,
                invoiceId: res.invoiceId,
                status: 'void',
              });
            }
            if (!res) {
              throw new MpError(
                'Subscription Service',
                'Subscription not found!',
                404
              );
            }
            this.broker.cacher.clean(`subscription.getByStore:${res.storeId}*`);
            this.broker.cacher.clean(`subscription.getAll:${res.storeId}*`);
            this.broker.cacher.clean(`stores.get:${res.storeId}*`);
            this.broker.cacher.clean(`stores.me:${instance.consumer_key}*`);
            return { ...res, id: res._id, _id: undefined };
          });
      },
    },
  },
  methods: {
    /**
     * Transform a result entity
     *
     * @param {Context} ctx
     * @param {Object} entity
     */
    transformMembershipEntity(entity: Membership): Membership | boolean {
      if (!entity) return false;
      const membership = Object.assign({}, entity);
      membership.id = membership._id;
      delete membership._id;
      return this.sanitizeObject(membership);
    },
    /**
     * Sanitize Result
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
  },
};

export = TheService;