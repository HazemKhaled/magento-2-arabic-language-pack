import { Context, ServiceSchema } from 'moleculer';
import DbService from '../utilities/mixins/mongo.mixin';
import { Membership } from '../utilities/types';
import { CreateMembershipValidation } from '../utilities/validations';
// tslint:disable-next-line:no-var-requires
const { MoleculerError } = require('moleculer').Errors;

const TheService: ServiceSchema = {
    name: 'membership',
    mixins: [DbService('membership')],
    actions: {
        create: {
            auth: 'Basic',
            params: CreateMembershipValidation,
            handler(ctx: Context): Promise<Membership> {
                ctx.params._id = `m-${Date.now()}`;
                return this.adapter
                    .insert(ctx.params)
                    .then((res: Membership) => {
                        this.broker.cacher.clean(`membership.list:**`);
                        return this.normalizeId(res)
                    })
                    .catch((err: any) => {
                        if (err.name === 'MoleculerError') {
                            throw new MoleculerError(err.message, err.code);
                        }
                        throw new MoleculerError(err, 500);
                    });
            }
        },
        get: {
            auth: 'Basic',
            params: {
                id: [{ type: 'string' }, { type: 'number' }]
            },
            cache: {
              keys: ['id'],
              ttl: 60 * 60 // 1 hour
            },
            handler(ctx: Context): Promise<Membership> {
                return this.adapter
                    .findOne({_id: ctx.params.id, active: true})
                    .then((res: Membership) => {
                        if (!res) {
                            return this.adapter
                            .findOne({isDefault: true})
                        }
                        return this.normalizeId(res);
                    })
                    .catch((err: any) => {
                        if (err.name === 'MoleculerError') {
                            throw new MoleculerError(err.message, err.code);
                        }
                        throw new MoleculerError(err, 500);
                    });
            }
        },
        list: {
            auth: 'Basic',
            cache: {
              ttl: 60 * 60 // 1 hour
            },
            handler(): Promise<Membership[]> {
                return this.adapter
                    .find()
                    .then((res: Membership[]) => {
                        if (res.length !== 0) return res.map(membership => this.normalizeId(membership));
                        throw new MoleculerError('No Membership found!', 404);
                    })
                    .catch((err: any) => {
                        if (err.name === 'MoleculerError') {
                            throw new MoleculerError(err.message, err.code);
                        }
                        throw new MoleculerError(err, 500);
                    });
            }
        },
        update: {}
    },
    methods: {
        /**
         * Convert object _id to id
         *
         * @param {{_id: string, id?: string}} obj
         * @returns
         */
        normalizeId(obj: { _id: string; id?: string }) {
            obj.id = obj._id;
            delete obj._id;
            return obj;
        }
    }
};

export = TheService;
