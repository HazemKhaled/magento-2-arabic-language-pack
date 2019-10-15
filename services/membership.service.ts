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
                    .then((res: Membership) => this.normalizeId(res))
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
            handler(ctx: Context): Promise<Membership> {
                return this.adapter
                    .findById(ctx.params.id)
                    .then((res: Membership) => {
                        if (res) {
                            return this.normalizeId(res);
                        }
                        throw new MoleculerError('No Membership found for this ID', 404);
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
