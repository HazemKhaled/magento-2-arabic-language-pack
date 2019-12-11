import { Context, Errors, ServiceSchema } from 'moleculer';
import DbService from '../utilities/mixins/mongo.mixin';
import { MembershipOpenapi } from '../utilities/mixins/openapi';
import { Membership } from '../utilities/types';
import { CreateMembershipValidation, UpdateMembershipValidation } from '../utilities/validations';
const MoleculerError = Errors.MoleculerError;

const TheService: ServiceSchema = {
  name: 'membership',
  mixins: [DbService('membership'), MembershipOpenapi],
  actions: {
    create: {
      auth: 'Basic',
      params: CreateMembershipValidation,
      async handler(ctx: Context): Promise<Membership> {
        const { params } = ctx;
        params._id = `m-${params.id || Date.now()}`;
        delete params.id;
        if (params.isDefault) {
          const currentDefault = await this.adapter.findOne({ isDefault: true, active: true });
          if (currentDefault) {
            throw new MoleculerError('There is an active default you add new one');
          }
        }
        return this.adapter
          .insert(params)
          .then((res: Membership) => {
            this.broker.cacher.clean(`membership.list:**`);
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
          .findOne({ _id: ctx.params.id, active: true })
          .then((res: Membership) => {
            if (!res) {
              return this.adapter
                .findOne({ isDefault: true })
                .then((def: Membership) => this.normalizeId(def));
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
    update: {
      auth: 'Basic',
      params: UpdateMembershipValidation,
      async handler(ctx: Context): Promise<Membership> {
        const { params } = ctx;
        const id = params.id;
        delete params.id;
        return this.adapter
          .updateById(id, { $set: { ...params } })
          .then((res: Membership) => {
            this.broker.cacher.clean(`membership.list:**`);
            this.broker.cacher.clean(`membership.get:${ctx.params.id}**`);
            if (!res) {
              throw new MoleculerError('Membership not found', 404);
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
    }
  },
  methods: {
    /**
     * Convert object _id to id
     *
     * @param {({_id: string})} obj
     * @returns
     */
    normalizeId(obj: { _id: string }) {
      const newObj = {
        id: obj._id,
        ...obj
      };
      delete newObj._id;
      return newObj;
    }
  }
};

export = TheService;
