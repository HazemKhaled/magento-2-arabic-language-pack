import { Context, ServiceSchema } from 'moleculer';
import * as Cron from 'moleculer-cron';
import { Store } from '../utilities/types';

const TheService: ServiceSchema = {
  name: 'subscription-cron',
  /**
   * Crons
   */
  crons: [
    {
      name: 'renewSubscriptions',
      cronTime: process.env.SUBSCRIPTION_CRON || '* * * * *', // Every minute
      async onTick() {
        const job = this.getJob('renewSubscriptions');
        job.stop();
        await this.call('subscription-cron.run');
        job.start();
      },
    },
  ],

  mixins: [Cron],
  actions: {
    run: {
      cache: false,
      async handler(ctx: Context) {
        const subscription = await ctx.call('subscription.getSubscriptionByExpireDate', {
          days: 7,
        }).then(null, err => {
          if(err.code === 422) {
            this.logger.info('No Store To Renew It\'s Subscription');
            return false;
          }
          throw err;
        });
        if (!subscription) {
          return null;
        }

        try {
          const createSubResponse = await ctx.call('subscription.create', {
            storeId: subscription.storeId,
            membership: subscription.membershipId,
          });
          if (createSubResponse.id) {
            ctx.call('subscription.updateSubscription', {
              id: String(subscription.id),
              renewed: true,
            });
            ctx.call('crm.addTagsByUrl', {
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
