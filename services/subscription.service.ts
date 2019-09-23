import { Context, ServiceSchema } from 'moleculer';
import fetch from 'node-fetch';
import { StoreUser } from '../utilities/types/store.type';
import { Subscription, User } from '../utilities/types/user.type';


const TheService: ServiceSchema = {
    name: 'subscription',
    /**
     * Actions
     */

    settings: {
        free: {
            id: 99999999,
            membership_id: 99999999,
            membership_name: 'Free',
            gateway_id: 'free',
            start_date: '2018-11-29T12:05:47.000Z',
            expire_date: '2099-12-31T00:00:00.000Z',
            trial_expire_date: '1970-01-01T00:00:00.000Z',
            trial_period_completed: false,
            status: 'active',
            payments: [],
            payment_type: 'permanent',
            post_modified: '1970-01-01T00:00:00.000Z',
            attr_products_limit: 500,
            attr_stores_limit: 1,
            attr_language_limit: 1,
            attr_order_processing_fees: 2,
            attr_cod_fees: 0,
            attr_users_limit: 1
        }
    },

    actions: {
        /**
         * Get Subscription for collection of users
         *
         * @param {string} url
         * @returns {Promise<Subscription | false>}
         */
        get: {
            params: {
                url: 'string'
            },
            cache: {
                keys: ['url'],
                ttl: 60 * 60 // 1 hour
            },
            async handler(ctx: Context): Promise<Subscription | false> {
                const store = await ctx.call('stores.findInstance', {id: ctx.params.url});
                if(store.errors) {
                    return false;
                }
                // Getting the user Information to check subscription
                const ownerEmails: string[] = store.users
                .filter((usr: StoreUser) => usr.roles.includes('owner'))
                .map((usr: StoreUser) => usr.email);

                let users: any = await fetch(
                `${process.env.KLAYER_URL}/api/Partners?filter=${JSON.stringify({
                    where: {
                        email: { $in: ownerEmails }
                    }
                })}&access_token=${process.env.KLAYER_TOKEN}`
                ).catch(err =>{
                    this.logger.error(err);
                    return [];
                });

                try{
                    users = await users.json();
                }catch(err){
                    this.logger.error(err);
                }

                // Calculate active subscription
                const max: Subscription[] = [this.settings.free];
                let lastLimit = 0;

                // Get all subscriptions from all users
                const date = new Date();
                if (users.error) {
                    return max.pop();
                }
                users
                .reduce((accumulator: Subscription[], current: User) => {
                    return accumulator.concat(
                        current.subscriptions.filter(
                            (subscription: Subscription) => new Date(subscription.expire_date) > date
                        )
                    );
                }, [])
                .forEach((subscription: Subscription) => {
                    if (Number(subscription.attr_products_limit) > lastLimit) {
                    max.push(subscription);
                    lastLimit = Number(subscription.attr_products_limit);
                    }
                });

                // Use the highest number of product count
                return max.pop();
            }
        }
    }
};

export = TheService;