import { Context, Errors, ServiceSchema } from 'moleculer';
import DbService from '../utilities/mixins/mongo.mixin';
import { TaxOpenapi } from '../utilities/mixins/openapi';
import { DbTax, RTax } from '../utilities/types/tax.type';
import { TaxesValidation } from '../utilities/mixins/validation';

const MoleculerError = Errors.MoleculerError;

const TaxesService: ServiceSchema = {
  name: 'taxes',
  mixins: [DbService('taxes'), TaxesValidation, TaxOpenapi],
  actions: {
    tCreate: {
      auth: 'Basic',
      async handler(ctx: Context): Promise<RTax> {
        const taxBody = ctx.params;
        const omsTax = await ctx.call('oms.createTax', {
          name: taxBody.name,
          percentage: taxBody.percentage,
          type: 'tax',
        });
        taxBody.omsId = omsTax.tax.id;
        return this.adapter
          .insert(taxBody)
          .then((tax: DbTax) => {
            this.broker.cacher.clean('taxes.tList:*');
            this.broker.cacher.clean('taxes.tCount:*');
            return { tax: this.sanitizer(tax) };
          })
          .catch((err: any) => {
            throw new MoleculerError(err, 500);
          });
      },
    },
    tUpdate: {
      auth: 'Basic',
      async handler(ctx: Context): Promise<RTax> {
        const { id } = ctx.params;
        const $set = ctx.params;
        if ($set.country) {
          $set.country = $set.country.toUpperCase();
        }
        delete $set.id;

        const taxUpdateData = await this.adapter
          .updateById(id, { $set })
          .then((tax: DbTax) => {
            if (!tax) {
              throw new MoleculerError('There is no tax with that ID', 404);
            }

            this.broker.cacher.clean(`taxes.tGet:${id}*`);
            this.broker.cacher.clean('taxes.tList:*');
            this.broker.cacher.clean('taxes.tCount:*');

            return {
              tax: this.sanitizer(tax),
            };
          })
          .catch((err: any) => {
            throw new MoleculerError(
              err.message ? err.message : 'Something went wrong.',
              err.code < 500 ? err.code : 500,
            );
          });
        if (taxUpdateData.tax) {
          ctx.call('oms.updateTax', ['name', 'percentage'].reduce((acc, key) => {
            if (!$set[key]) {
              delete acc[key as keyof {}];
            }
            return acc;
          }, {
            id: taxUpdateData.tax.omsId,
            name: $set.name,
            percentage: $set.percentage,
          }));
        }
        return taxUpdateData;
      },
    },
    tGet: {
      auth: 'Basic',
      cache: {
        keys: ['id'],
        ttl: 60 * 60, // 1 hour
      },
      handler(ctx: Context): RTax {
        return this.adapter.findById(ctx.params.id).then((tax: DbTax) => {
          if (tax) {
            return { tax: this.sanitizer(tax) };
          }
          throw new MoleculerError('There is no tax with that ID', 404);
        }).catch((err: any) => {
          throw new MoleculerError(
            err.message ? err.message : 'Something went wrong.',
            err.code < 500 ? err.code : 500,
          );
        });
      },
    },
    tList: {
      auth: 'Basic',
      cache: {
        keys: ['page', 'perPage', 'country', 'class'],
        ttl: 60 * 60, // 1 hour
      },
      handler(ctx: Context): RTax[] {
        const { country } = ctx.params;
        const classes = ctx.params.class;
        const query: any = {};
        if (country) {
          query.country = country.toUpperCase();
        }
        if (Array.isArray(classes)) {
          query.class = { $in: classes };
        }
        if (typeof classes === 'string' ) {
          query.class = classes;
        }
        const page = Number(ctx.params.page) || 1;
        const limit = Number(ctx.params.perPage) || 50;
        const offset = (page - 1) * limit;
        return this.adapter
          .find({ limit, offset, query })
          .then(async (res: DbTax[]) => ({
            taxes: res.map(tax => this.sanitizer(tax)),
            total: await ctx.call('taxes.tCount', { query }),
          }))
          .catch((err: any) => {
            throw new MoleculerError(
              err.message ? err.message : 'Something went wrong.',
              err.code < 500 ? err.code : 500,
            );
          });
      },
    },
    tDelete: {
      auth: 'Basic',
      async handler(ctx: Context) {
        const taxDeleteData = await this.adapter
          .removeById(ctx.params.id)
          .then((tax: DbTax) => {
            if (!tax) {
              throw new MoleculerError('There is no tax with that ID', 404);
            }

            this.broker.cacher.clean(`taxes.tGet:${ctx.params.id}*`);
            this.broker.cacher.clean('taxes.tList:*');
            this.broker.cacher.clean('taxes.tCount:*');

            return {
              tax: this.sanitizer(tax),
              message: 'Tax deleted successfully!',
            };
          })
          .catch((err: any) => {
            throw new MoleculerError(
              err.message ? err.message : 'Something went wrong.',
              err.code < 500 ? err.code : 500,
            );
          });

        if (taxDeleteData.tax) {
          ctx.call('oms.deleteTax', { id: taxDeleteData.tax.omsId });
        }

        return taxDeleteData;
      },
    },
    taxStatus: {
      handler(): { sales: boolean; subscription: boolean } {
        return {
          sales: !!Number(process.env.IS_SALES_TAX_INCLUSIVE),
          subscription: !!Number(process.env.IS_SUB_TAX_INCLUSIVE),
        };
      },
    },
    tCount: {
      cache: {
        keys: ['query'],
        ttl: 60 * 60,
      },
      handler(ctx: Context) {
        return this.adapter.count({query: ctx.params.query}).catch(() => {
          throw new MoleculerError('There is an error fetching the taxes total', 500);
        });
      },
    },
  },
  methods: {
    sanitizer(dbTax: DbTax): RTax {
      const id = dbTax._id;
      delete dbTax._id;
      return { id, ...dbTax };
    },
  },
};

export = TaxesService;
