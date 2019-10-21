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
            }
        }
    ],

    mixins: [Cron],
    actions: {
        run: {
            cache: false,
            async handler(ctx: Context) {
                const subscription = await ctx.call('subscription.getSubscriptionByExpireDate', { days: 7 });
                if(!subscription) {
                    return null;
                }
                try
                {
                    const createSubResponse = await ctx.call('subscription.create', {
                        storeId: subscription.storeId,
                        membership: subscription.membershipId
                    });
                    if(createSubResponse.id) {
                        ctx.call('subscription.updateSubscription', {
                            id: String(subscription.id),
                            renewed: true
                        });
                    }
                    return createSubResponse;
                }
                catch (err)
                {
                    // tslint:disable-next-line
                    console.log(err);
                }
            }
        }
    }
}


export = TheService;
