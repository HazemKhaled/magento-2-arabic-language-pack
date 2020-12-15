import { Context, Errors, ServiceSchema, GenericObject } from 'moleculer';

import DbService from '../utilities/mixins/mongo.mixin';
import { MembershipOpenapi } from '../utilities/mixins/openapi';
import {
  Membership,
  Coupon,
  MembershipRequestParams,
  CommonError,
} from '../utilities/types';
import { MembershipValidation } from '../utilities/mixins/validation';
import { TaxCheck } from '../utilities/mixins/tax.mixin';

const MoleculerError = Errors.MoleculerError;

const TheService: ServiceSchema = {
  name: 'membership',
  mixins: [
    new DbService('membership').start(),
    MembershipValidation,
    MembershipOpenapi,
    TaxCheck,
  ],
  actions: {
    createOne: {
      auth: ['Basic'],
      rest: 'POST /',
      async handler(
        ctx: Context<MembershipRequestParams>
      ): Promise<Membership> {
        const { params } = ctx;

        // Add created and updated dates of the coupon
        params.createdAt = new Date();
        params.updatedAt = new Date();

        params._id = `m-${params.id || Date.now()}`;
        delete params.id;
        if (params.isDefault) {
          const [currentDefault] = await ctx.call<
            Membership[],
            { query: Partial<Membership> }
          >('membership.find', {
            query: {
              isDefault: true,
              active: true,
            },
          });
          if (currentDefault) {
            throw new MoleculerError(
              'There is an active default you add new one'
            );
          }
        }
        return ctx
          .call<Membership, { entity: Membership }>('membership.insert', {
            entity: params,
          })
          .then(res => {
            this.broker.cacher.clean('membership.getAll:**');
            return this.normalize(res);
          })
          .catch((err: CommonError) => {
            if (err.name === 'MoleculerError') {
              throw new MoleculerError(err.message, err.code);
            }
            throw new MoleculerError(String(err), 500);
          });
      },
    },
    getOne: {
      auth: ['Basic'],
      cache: {
        keys: ['id', 'country', 'coupon', 'active'],
        ttl: 60 * 60 * 24,
      },
      rest: 'GET /:id',
      handler(ctx: Context<MembershipRequestParams>): Promise<Membership> {
        const { active, id, country } = ctx.params;

        if (id) {
          return this.getById(id);
        }

        const query: Partial<MembershipRequestParams> = { _id: id };
        if (active !== undefined) {
          query.active = active;
        }

        return ctx
          .call<Membership[], GenericObject>('membership.find', {
            query,
          })
          .then(async ([res]) => {
            if (!res) {
              return ctx
                .call<Membership[], GenericObject>('membership.find', {
                  query: { isDefault: true },
                })
                .then(([def]) => this.normalize(def));
            }

            if (ctx.params.coupon) {
              await this.applyCouponDiscount(ctx.params.coupon, res);
            }

            return this.normalize(res, country);
          })
          .catch((err: CommonError) => {
            if (err.name === 'MoleculerError') {
              throw new MoleculerError(err.message, err.code);
            }
            throw new MoleculerError(String(err), 500);
          });
      },
    },
    getAll: {
      auth: ['Basic'],
      cache: {
        keys: ['country'],
        ttl: 60 * 60 * 24,
      },
      rest: 'GET /',
      handler(ctx: Context<{ country: string }>): Promise<Membership[]> {
        const { country } = ctx.params;
        let query: { [key: string]: GenericObject } = {};
        if (ctx.params.country) {
          query = {
            $or: [{ country }, { country: { $exists: false } }],
          };
        }
        return ctx
          .call<Membership[], GenericObject>('membership.find', {
            query,
          })
          .then(res => {
            if (!res.length)
              throw new MoleculerError('No Membership found!', 404);
            const cMemberships = res.filter(me => me.country === country);
            return this.listNormalize(
              cMemberships.length ? cMemberships : res,
              country
            );
          })
          .catch((err: CommonError) => {
            if (err.name === 'MoleculerError') {
              throw new MoleculerError(err.message, err.code);
            }
            throw new MoleculerError(String(err), 500);
          });
      },
    },
    updateOne: {
      auth: ['Basic'],
      rest: 'PUT /:id',
      async handler(ctx: Context<Membership>): Promise<Membership> {
        const { params } = ctx;

        return ctx
          .call<Membership, Membership>('membership.update', {
            ...params,
            updatedAt: new Date(),
          })
          .then(res => {
            this.broker.cacher.clean('membership.getAll:**');
            this.broker.cacher.clean(`membership.getOne:${params.id}**`);
            if (!res) {
              throw new MoleculerError('Membership not found', 404);
            }

            return res;
          })
          .catch((err: CommonError) => {
            if (err.name === 'MoleculerError') {
              throw new MoleculerError(err.message, err.code);
            }
            throw new MoleculerError(String(err), 500);
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
    async normalize(
      obj: { _id: string; country?: string; cost: number },
      country: string
    ): Promise<GenericObject> {
      let taxData: GenericObject = { value: 0 };
      if (country || obj.country) {
        taxData =
          (await this.getTaxWithCalc(country || obj.country, {
            taxClass: 'service',
            rate: obj.cost,
          })) || {};
        taxData.value = taxData.percentage
          ? Number(
              (taxData.isInclusive === false
                ? (taxData.percentage / 100) * obj.cost
                : 0
              ).toFixed(2)
            )
          : 0;
      }
      const newObj = {
        id: obj._id,
        ...obj,
        cost: Number((obj.cost + taxData.value).toFixed(2)),
        totals: {
          cost: obj.cost,
          taxData,
        },
      };
      delete newObj._id;
      return newObj;
    },
    async listNormalize(
      objArr: { _id: string; country?: string; cost: number }[],
      country: string
    ): Promise<GenericObject> {
      let taxData: GenericObject = {};
      if (country || objArr[0].country) {
        taxData = await this.getItemTax(country || objArr[0].country, {
          taxClass: 'service',
        });
      }
      return objArr.map(obj => {
        taxData.value = taxData.percentage
          ? Number(
              (taxData.isInclusive === false
                ? (taxData.percentage / 100) * obj.cost
                : 0
              ).toFixed(2)
            )
          : 0;
        const newObj = {
          id: obj._id,
          ...obj,
          cost: Number((obj.cost + taxData.value).toFixed(2)),
          totals: {
            cost: obj.cost,
            taxData,
          },
        };
        delete newObj._id;
        return newObj;
      });
    },
    async applyCouponDiscount(couponCode, membership): Promise<void> {
      const coupon: Coupon = await this.call('coupon.getOne', {
        id: couponCode,
        membership: membership.id,
        type: 'subscription',
      }).then(null, (err: unknown) => err);
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
            discount = Number(
              ((membership.cost / 100) * coupon.discount.total.value).toFixed(2)
            );
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
