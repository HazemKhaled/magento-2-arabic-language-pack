import { Context, ServiceSchema, GenericObject } from 'moleculer';
import * as Cron from 'moleculer-cron';

import { Store, Subscription, CrmStore } from '../utilities/types';

const TheService: ServiceSchema = {
  name: 'subscription-cron',
  /**
   * Crons
   */
  crons: [
    {
      name: 'renewSubscriptions',
      // Every minute
      cronTime: process.env.SUBSCRIPTION_CRON || '* * * * *',
      async onTick() {
        const job = this.getJob('renewSubscriptions');
        job.stop();
        await this.call('subscription-cron.run').catch(this.logger.error);
        job.start();
      },
    },
  ],

  mixins: [Cron],
  actions: {
    run: {
      cache: false,
      async handler(ctx: Context) {
        const subscription: any = await ctx
          .call<GenericObject, Partial<Subscription>>(
            'subscription.getSubscriptionByExpireDate',
            {
              afterDays: 6 * 30,
              beforeDays: 1,
            }
          )
          .then(null, err => {
            if (err.code === 422) {
              this.logger.info("No Store To Renew It's Subscription");
              return false;
            }
            throw err;
          });
        if (!subscription) {
          return null;
        }

        const store: Store = await ctx.call<Store, Partial<Subscription>>(
          'stores.findInstance',
          {
            id: subscription.storeId,
          }
        );

        if (store?.status !== 'confirmed') {
          return null;
        }

        try {
          const createSubResponse: Subscription = await ctx.call<
            Subscription,
            Partial<Subscription>
          >('subscription.create', {
            storeId: subscription.storeId,
            membership: subscription.membershipId,
          });
          if (createSubResponse.id) {
            ctx.call<GenericObject, Partial<Subscription>>(
              'subscription.updateSubscription',
              {
                id: String(subscription.id),
                renewed: true,
              }
            );
            ctx.call<GenericObject, Partial<CrmStore>>('crm.addTagsByUrl', {
              id: subscription.storeId,
              tag: 'subscription-renew',
            });
          }
          return createSubResponse;
        } catch (err) {
          this.logger.error(err);
        }
      },
    },
  },
};

export = TheService;
