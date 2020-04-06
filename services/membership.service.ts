import { Context, Errors, ServiceSchema } from 'moleculer';
import DbService from '../utilities/mixins/mongo.mixin';
import { MembershipOpenapi } from '../utilities/mixins/openapi';
import { Membership } from '../utilities/types';
import { MembershipValidation } from '../utilities/mixins/validation';
import TaxCheck from '../utilities/mixins/tax.mixin';
const MoleculerError = Errors.MoleculerError;

const TheService: ServiceSchema = {
  name: 'membership',
  mixins: [DbService('membership'), MembershipValidation, MembershipOpenapi, TaxCheck],
  actions: {
    create: {
      auth: 'Basic',
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
            this.broker.cacher.clean('membership.list:**');
            return this.normalize(res);
          })
          .catch((err: any) => {
            if (err.name === 'MoleculerError') {
              throw new MoleculerError(err.message, err.code);
            }
            throw new MoleculerError(err, 500);
          });
      },
    },
    get: {
      auth: 'Basic',
      cache: {
        keys: ['id'],
        ttl: 60 * 60 * 24, // 1 day
      },
      handler(ctx: Context): Promise<Membership> {
        return this.adapter
          .findOne({ _id: ctx.params.id, active: true })
          .then((res: Membership) => {
            if (!res) {
              return this.adapter
                .findOne({ isDefault: true })
                .then((def: Membership) => this.normalize(def));
            }
            return this.normalize(res);
          })
          .catch((err: any) => {
            if (err.name === 'MoleculerError') {
              throw new MoleculerError(err.message, err.code);
            }
            throw new MoleculerError(err, 500);
          });
      },
    },
    list: {
      auth: 'Basic',
      cache: {
        keys: ['country'],
        ttl: 60 * 60 * 24, // 1 day
      },
      handler(ctx): Promise<Membership[]> {
        const { country } = ctx.params;
        let query: { [key: string]: any } = {};
        if (ctx.params.country) {
          query = {
            $or: [
              { country },
              { country: { $exists: false } },
            ],
          };
        }
        return this.adapter
          .find({query})
          .then((res: Membership[]) => {
            if (!res.length) throw new MoleculerError('No Membership found!', 404);
            const cMemberships = res.filter(m => m.country === country);
            return this.listNormalize(cMemberships.length ? cMemberships : res);
          })
          .catch((err: any) => {
            if (err.name === 'MoleculerError') {
              throw new MoleculerError(err.message, err.code);
            }
            throw new MoleculerError(err, 500);
          });
      },
    },
    update: {
      auth: 'Basic',
      async handler(ctx: Context): Promise<Membership> {
        const { params } = ctx;
        const id = params.id;
        delete params.id;
        return this.adapter
          .updateById(id, { $set: { ...params } })
          .then((res: Membership) => {
            this.broker.cacher.clean('membership.list:**');
            this.broker.cacher.clean(`membership.get:${id}**`);
            if (!res) {
              throw new MoleculerError('Membership not found', 404);
            }
            return this.normalize(res);
          })
          .catch((err: any) => {
            if (err.name === 'MoleculerError') {
              throw new MoleculerError(err.message, err.code);
            }
            throw new MoleculerError(err, 500);
          });
      },
    },
  },
  methods: {
    /**
     * Convert object _id to id
     *
     * @param {({_id: string})} obj
     * @returns
     */
    async normalize(obj: { _id: string; country?: string; cost: number }) {
      let tax = 0;
      if (obj.country) {
        const taxData = await this.getItemTax(obj.country, {taxClass: 'service'});
        tax = +(taxData.isInclusive === false ? taxData.percentage / 100 * obj.cost : 0).toFixed(2);
      }
      const newObj = {
        id: obj._id,
        ...obj,
        cost: +(obj.cost + tax).toFixed(2),
        totals: {
          cost: obj.cost,
          tax,
        },
      };
      delete newObj._id;
      return newObj;
    },
    async listNormalize(objArr: Array<{ _id: string; country?: string; cost: number }>) {
      let taxData: any = 0;
      if (objArr[0].country) {
        taxData = await this.getItemTax(objArr[0].country, {taxClass: 'service'});
      }
      return objArr.map(obj => {
        const tax = taxData && +(taxData.isInclusive === false ? taxData.percentage / 100 * objArr[0].cost : 0).toFixed(2);
        const newObj = {
          id: obj._id,
          ...obj,
          cost: +(obj.cost + tax).toFixed(2),
          totals: {
            cost: obj.cost,
            tax,
          },
        };
        delete newObj._id;
        return newObj;
      });
    },
  },
};

export = TheService;
