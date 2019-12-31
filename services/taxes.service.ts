import { Context, Errors, ServiceSchema } from 'moleculer';
import { isError } from 'util';
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
      handler(ctx: Context): RTax {
        return this.adapter
          .insert(ctx.params)
          .then((tax: DbTax) => ({ tax: this.sanitizer(tax) }))
          .catch((err: any) => {
            throw new MoleculerError(err, 500);
          });
      },
    },
    tUpdate: {
      auth: 'Basic',
      handler(ctx: Context): RTax {
        const { id } = ctx.params;
        const $set = ctx.params;
        $set.country = $set.country.toLowerCase();
        delete $set.id;
        return this.adapter
          .updateById(id, { $set })
          .then((tax: DbTax) => {
            if (!tax) {
              throw new MoleculerError('There is no tax with that ID', 404);
            }
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
      },
    },
    tFindByCountry: {
      auth: 'Basic',
      handler(ctx: Context): RTax[] {
        const query = ctx.params;
        query.country = query.country.toLowerCase();
        if (Array.isArray(query.class)) {
          query.class = { $in: query.class };
        }
        if (!query.class) {
          delete query.class;
        }
        return this.adapter
          .find({ query })
          .then((res: DbTax[]) => ({ taxes: res.map(tax => this.sanitizer(tax)) }))
          .catch((err: any) => {
            throw new MoleculerError(err, 500);
          });
      },
    },
    tDelete: {
      auth: 'Basic',
      handler(ctx: Context) {
        return this.adapter
          .removeById(ctx.params.id)
          .then((tax: DbTax) => {
            if (!tax) {
              throw new MoleculerError('There is no tax with that ID', 404);
            }
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