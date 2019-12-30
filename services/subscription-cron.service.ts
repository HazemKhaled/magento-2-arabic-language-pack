import { Context, Errors, ServiceSchema } from 'moleculer';
import * as Cron from 'moleculer-cron';

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
        await this.call('subscription-cron.run');
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
        }).then(null, (err)=> {
          if(err.code === 422) {
            console.log('No Store To Renew It\'s Subscription');
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
            ctx.call('crm.addTagByUrl', {
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
