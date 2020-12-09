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
      async onTick(): Promise<void> {
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
      async handler(ctx: Context): Promise<null | Subscription> {
        const subscription: any = await ctx
          .call<GenericObject, Partial<Subscription>>(
            'subscription.getOneByExpireDate',
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

        const store = await ctx.call<Store, { id: string }>('stores.get', {
          id: subscription.storeId,
        });

        if (store?.status !== 'confirmed') {
          return null;
        }

        try {
          const createSubResponse: Subscription = await ctx.call<
            Subscription,
            Partial<Subscription>
          >('subscription.createOne', {
            storeId: subscription.storeId,
            membership: subscription.membershipId,
          });
          if (createSubResponse.id) {
            ctx.call<GenericObject, Partial<Subscription>>(
              'subscription.updateOne',
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
