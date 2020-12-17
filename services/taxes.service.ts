import { Context, Errors, GenericObject, ServiceSchema } from 'moleculer';

import DbService from '../utilities/mixins/mongo.mixin';
import { TaxOpenapi } from '../utilities/mixins/openapi';
import { DbTax, TaxRequestParams, CommonError } from '../utilities/types';
import { TaxesValidation } from '../utilities/mixins/validation';

const MoleculerError = Errors.MoleculerError;

const TaxesService: ServiceSchema = {
  name: 'taxes',
  mixins: [new DbService('taxes').start(), TaxesValidation, TaxOpenapi],
  settings: {
    rest: 'tax',
  },
  actions: {
    createOne: {
      auth: ['Basic'],
      rest: 'POST /',
      async handler(ctx: Context<Partial<DbTax>>): Promise<{ tax: DbTax }> {
        const taxBody: Partial<DbTax> = {
          ...ctx.params,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const omsTax = await ctx.call<{ tax: { id: string } }, Partial<DbTax>>(
          'oms.createTax',
          {
            name: taxBody.name,
            percentage: taxBody.percentage,
            type: 'tax',
          }
        );
        taxBody.omsId = omsTax.tax.id;
        return ctx
          .call<DbTax, Partial<DbTax>>('taxes.create', taxBody)
          .then(tax => {
            this.broker.cacher.clean('taxes.getAll:*');

            return { tax: this.sanitizer(tax) as DbTax };
          })
          .catch((err: CommonError) => {
            throw new MoleculerError(String(err), 500);
          });
      },
    },
    updateOne: {
      auth: ['Basic'],
      rest: 'PUT /:id',
      async handler(ctx: Context<Partial<DbTax>>): Promise<DbTax> {
        const record = ctx.params;
        record.updatedAt = new Date();

        if (record.country) {
          record.country = record.country.toUpperCase();
        }

        const taxUpdateData = await ctx
          .call<DbTax, Partial<DbTax>>('taxes.update', record)
          .then(tax => {
            if (!tax) {
              throw new MoleculerError('There is no tax with that ID', 404);
            }

            this.broker.cacher.clean(`taxes.getOne:${record.id}*`);
            this.broker.cacher.clean('taxes.getAll:*');

            return this.sanitizer(tax) as DbTax;
          })
          .catch((err: CommonError) => {
            throw new MoleculerError(
              err.message ? err.message : 'Something went wrong.',
              err.code < 500 ? err.code : 500
            );
          });

        if (taxUpdateData.omsId) {
          ctx.call<void, GenericObject>('oms.updateTax', {
            id: taxUpdateData.omsId,
            name: taxUpdateData.name,
            percentage: taxUpdateData.percentage,
          });
        }

        return taxUpdateData;
      },
    },
    getOne: {
      auth: ['Basic'],
      cache: {
        keys: ['id'],
        // 1 day
        ttl: 60 * 60 * 24,
      },
      rest: 'GET /:id',
      handler(ctx: Context<DbTax>): DbTax {
        return this.getById(ctx.params.id)
          .then((tax: DbTax) => {
            if (tax) {
              return { tax: this.sanitizer(tax) };
            }
            throw new MoleculerError('There is no tax with that ID', 404);
          })
          .catch((err: CommonError) => {
            throw new MoleculerError(
              err.message ? err.message : 'Something went wrong.',
              err.code < 500 ? err.code : 500
            );
          });
      },
    },
    getAll: {
      auth: ['Basic'],
      cache: {
        keys: ['page', 'perPage', 'country', 'class'],
        // 1 day
        ttl: 60 * 60 * 24,
      },
      rest: 'GET /',
      handler(ctx: Context<TaxRequestParams>): DbTax[] {
        const { country } = ctx.params;
        const classes = ctx.params.class;
        const query: GenericObject = {};
        if (country) {
          query.country = country.toUpperCase();
        }
        if (Array.isArray(classes)) {
          query.class = { $in: classes };
        }
        if (typeof classes === 'string') {
          query.class = classes;
        }
        const page = Number(ctx.params.page) || 1;
        const limit = Number(ctx.params.perPage) || 50;
        const offset = (page - 1) * limit;
        return this.actions
          .list({ limit, offset, query })
          .then(async (res: { rows: DbTax[]; total: number }) => ({
            taxes: res.rows.map(tax => this.sanitizer(tax)),
            total: res.total,
          }))
          .catch((err: CommonError) => {
            throw new MoleculerError(
              err.message ? err.message : 'Something went wrong.',
              err.code < 500 ? err.code : 500
            );
          });
      },
    },
    removeOne: {
      auth: ['Basic'],
      rest: 'DELETE /:id',
      async handler(
        ctx: Context<DbTax>
      ): Promise<{ tax: DbTax; message: string }> {
        const taxDeleteData = await ctx
          .call<DbTax, string>('taxes.remove', ctx.params.id)
          .then(tax => {
            if (!tax) {
              throw new MoleculerError('There is no tax with that ID', 404);
            }

            this.broker.cacher.clean(`taxes.getOne:${ctx.params.id}*`);
            this.broker.cacher.clean('taxes.getAll:*');

            return {
              tax: this.sanitizer(tax),
              message: 'Tax deleted successfully!',
            };
          })
          .catch((err: CommonError) => {
            throw new MoleculerError(
              err.message ? err.message : 'Something went wrong.',
              err.code < 500 ? err.code : 500
            );
          });

        if (taxDeleteData.tax) {
          ctx.call<void, Partial<TaxRequestParams>>('oms.deleteTax', {
            id: taxDeleteData.tax.omsId,
          });
        }

        return taxDeleteData;
      },
    },
  },
  methods: {
    sanitizer(dbTax: DbTax): DbTax {
      const id = dbTax._id;
      delete dbTax._id;
      return { id, ...dbTax };
    },
  },
};

export = TaxesService;
