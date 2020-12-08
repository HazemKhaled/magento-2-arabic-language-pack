import { Context, Errors, GenericObject, ServiceSchema } from 'moleculer';

import DbService from '../utilities/mixins/mongo.mixin';
import { TaxOpenapi } from '../utilities/mixins/openapi';
import {
  DbTax,
  RTax,
  TaxRequestParams,
  DynamicRequestParams,
  CommonError,
} from '../utilities/types';
import { TaxesValidation } from '../utilities/mixins/validation';

const MoleculerError = Errors.MoleculerError;

const TaxesService: ServiceSchema = {
  name: 'taxes',
  mixins: [new DbService('taxes').start(), TaxesValidation, TaxOpenapi],
  actions: {
    tCreate: {
      auth: ['Basic'],
      async handler(ctx: Context<Partial<DbTax>>): Promise<RTax> {
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
        return this.adapter
          .insert(taxBody)
          .then((tax: DbTax) => {
            this.broker.cacher.clean('taxes.tList:*');
            this.broker.cacher.clean('taxes.tCount:*');
            return { tax: this.sanitizer(tax) };
          })
          .catch((err: CommonError) => {
            throw new MoleculerError(String(err), 500);
          });
      },
    },
    tUpdate: {
      auth: ['Basic'],
      async handler(ctx: Context<GenericObject>): Promise<RTax> {
        const { id } = ctx.params;
        const $set = ctx.params;
        $set.updatedAt = new Date();

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
          .catch((err: CommonError) => {
            throw new MoleculerError(
              err.message ? err.message : 'Something went wrong.',
              err.code < 500 ? err.code : 500
            );
          });
        if (taxUpdateData.tax) {
          ctx.call<GenericObject, DynamicRequestParams>(
            'oms.updateTax',
            ['name', 'percentage'].reduce(
              (acc: GenericObject, key: string) => {
                if (!$set[key]) {
                  delete acc[key];
                }
                return acc;
              },
              {
                id: taxUpdateData.tax.omsId,
                name: $set.name,
                percentage: $set.percentage,
              }
            )
          );
        }
        return taxUpdateData;
      },
    },
    tGet: {
      auth: ['Basic'],
      cache: {
        keys: ['id'],
        // 1 day
        ttl: 60 * 60 * 24,
      },
      handler(ctx: Context<RTax>): RTax {
        return this.adapter
          .findById(ctx.params.id)
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
    tList: {
      auth: ['Basic'],
      cache: {
        keys: ['page', 'perPage', 'country', 'class'],
        // 1 day
        ttl: 60 * 60 * 24,
      },
      handler(ctx: Context<TaxRequestParams>): RTax[] {
        const { country } = ctx.params;
        const classes = ctx.params.class;
        const query: any = {};
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
        return this.adapter
          .find({ limit, offset, query })
          .then(async (res: DbTax[]) => ({
            taxes: res.map(tax => this.sanitizer(tax)),
            total: await ctx.call<number, Partial<TaxRequestParams>>(
              'taxes.tCount',
              {
                query,
              }
            ),
          }))
          .catch((err: CommonError) => {
            throw new MoleculerError(
              err.message ? err.message : 'Something went wrong.',
              err.code < 500 ? err.code : 500
            );
          });
      },
    },
    tDelete: {
      auth: ['Basic'],
      async handler(
        ctx: Context<RTax>
      ): Promise<{ tax: RTax; message: string }> {
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
          .catch((err: CommonError) => {
            throw new MoleculerError(
              err.message ? err.message : 'Something went wrong.',
              err.code < 500 ? err.code : 500
            );
          });

        if (taxDeleteData.tax) {
          ctx.call<GenericObject, Partial<TaxRequestParams>>('oms.deleteTax', {
            id: taxDeleteData.tax.omsId,
          });
        }

        return taxDeleteData;
      },
    },
    tCount: {
      cache: {
        keys: ['query'],
        ttl: 60 * 60,
      },
      handler(ctx: Context<TaxRequestParams>): Promise<number> {
        return this.adapter.count({ query: ctx.params.query }).catch(() => {
          throw new MoleculerError(
            'There is an error fetching the taxes total',
            500
          );
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
