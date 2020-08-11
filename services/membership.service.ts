import { Context, Errors, ServiceSchema, GenericObject } from 'moleculer';
import DbService from '../utilities/mixins/mongo.mixin';
import { MembershipOpenapi } from '../utilities/mixins/openapi';
import { Membership, Coupon } from '../utilities/types';
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

        // Add created and updated dates of the coupon
        params.createdAt = new Date();
        params.updatedAt = new Date();

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
    mGet: {
      auth: 'Basic',
      cache: {
        keys: ['id', 'country', 'coupon', 'active'],
        ttl: 60 * 60 * 24, // 1 day
      },
      handler(ctx: Context): Promise<Membership> {
        const { active, id, country } = ctx.params;
        const query: GenericObject = { _id: id };
        if (active !== undefined) {
          query.active = active;
        }

        return this.adapter
          .findOne(query)
          .then(async (res: Membership) => {
            if (!res) {
              return this.adapter
                .findOne({ isDefault: true })
                .then((def: Membership) => this.normalize(def));
            }

            if (ctx.params.coupon) {
              await this.applyCouponDiscount(ctx.params.coupon, res);
            }

            return this.normalize(res, country);
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
            return this.listNormalize(cMemberships.length ? cMemberships : res, country);
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
        return this.adapter.collection
          .updateOne({_id: id}, { $set: { ...params, updatedAt: new Date() } })
          .then((res: Membership) => {
            this.broker.cacher.clean('membership.list:**');
            this.broker.cacher.clean(`membership.mGet:${id}**`);
            if (!res) {
              throw new MoleculerError('Membership not found', 404);
            }
            return ctx.call('membership.mGet', { id });
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
    async normalize(obj: { _id: string; country?: string; cost: number }, country: string) {
      let taxData: any = { value: 0 };
      if (country || obj.country) {
        taxData = (await this.getTaxWithCalc(country || obj.country, {taxClass: 'service', rate: obj.cost})) || {};
        taxData.value = taxData.percentage ? +(taxData.isInclusive === false ? taxData.percentage / 100 * obj.cost : 0).toFixed(2) : 0;
      }
      const newObj = {
        id: obj._id,
        ...obj,
        cost: +(obj.cost + taxData.value).toFixed(2),
        totals: {
          cost: obj.cost,
          taxData,
        },
      };
      delete newObj._id;
      return newObj;
    },
    async listNormalize(objArr: Array<{ _id: string; country?: string; cost: number }>, country: string) {
      let taxData: any = {};
      if (country || objArr[0].country) {
        taxData = await this.getItemTax(country || objArr[0].country, {taxClass: 'service'});
      }
      return objArr.map(obj => {
        taxData.value = taxData.percentage ? +(taxData.isInclusive === false ? taxData.percentage / 100 * obj.cost : 0).toFixed(2) : 0;
        const newObj = {
          id: obj._id,
          ...obj,
          cost: +(obj.cost + taxData.value).toFixed(2),
          totals: {
            cost: obj.cost,
            taxData,
          },
        };
        delete newObj._id;
        return newObj;
      });
    },
    async applyCouponDiscount(couponCode, membership) {
      const coupon: Coupon = await this.broker
        .call('coupons.get', {
          id: couponCode,
          membership: membership.id,
          type: 'subscription',
        })
        .then(null, (err: any) => err);
      if (coupon instanceof Error) {
        throw new MoleculerError(coupon.message, Number(coupon.code));
      }
      let discount = 0;
      if (coupon) {
        switch (coupon.discount.total.type) {
        case '$':
          discount = Math.min(coupon.discount.total.value, membership.cost);
          break;
        case '%':
          discount = +((membership.cost / 100) * coupon.discount.total.value).toFixed(2);
          break;
        }
      }
      membership.coupon = coupon;
      membership.originalDiscount = membership.discount;
      membership.discount = Math.max(discount, membership.discount);
    },
  },
};

export = TheService;
