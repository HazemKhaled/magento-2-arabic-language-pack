import { Context, Errors, ServiceSchema } from 'moleculer';
import { isError } from 'util';
import DbService from '../utilities/mixins/mongo.mixin';
import { TaxOpenapi } from '../utilities/mixins/openapi';
import { DbTax, RTax } from '../utilities/types/tax.type';

const MoleculerError = Errors.MoleculerError;

const TaxesService: ServiceSchema = {
  name: 'taxes',
  mixins: [DbService('taxes'), TaxOpenapi],
  actions: {
    tCreate: {
      auth: 'Basic',
      params: {
        name: { type: 'string' },
        class: { type: 'array', items: { type: 'string' } },
        country: { type: 'string', min: 2, max: 2, pattern: /[a-zA-Z]/ },
        percentage: { type: 'number', convert: true },
        $$strict: true
      },
      handler(ctx: Context): RTax {
        return this.adapter
          .insert(ctx.params)
          .then((tax: DbTax) => ({ tax: this.sanitizer(tax) }))
          .catch((err: any) => {
            throw new MoleculerError(err, 500);
          });
      }
    },
    tUpdate: {
      params: {
        id: { type: 'string' },
        name: { type: 'string', optional: true },
        class: { type: 'array', items: { type: 'string' }, optional: true },
        country: { type: 'string', min: 2, max: 2, pattern: /[a-zA-Z]/, optional: true },
        percentage: { type: 'number', convert: true, optional: true },
        $$strict: true
      },
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
              tax: this.sanitizer(tax)
            };
          })
          .catch((err: any) => {
            throw new MoleculerError(
              err.message ? err.message : 'Something went wrong.',
              err.code < 500 ? err.code : 500
            );
          });
      }
    },
    tFindByCountry: {
      auth: 'Basic',
      params: {
        country: { type: 'string', min: 2, max: 2, pattern: /[a-zA-Z]/ },
        class: [
          { type: 'string', optional: true },
          { type: 'array', items: { type: 'string' }, optional: true }
        ],
        $$strict: true
      },
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
      }
    },
    tDelete: {
      auth: 'Basic',
      params: {
        id: { type: 'string' }
      },
      handler(ctx: Context) {
        return this.adapter
          .removeById(ctx.params.id)
          .then((tax: DbTax) => {
            if (!tax) {
              throw new MoleculerError('There is no tax with that ID', 404);
            }
            return {
              tax: this.sanitizer(tax),
              message: 'Tax deleted successfully!'
            };
          })
          .catch((err: any) => {
            throw new MoleculerError(
              err.message ? err.message : 'Something went wrong.',
              err.code < 500 ? err.code : 500
            );
          });
      }
    },
    taxStatus: {
      handler(): boolean {
        return process.env.IS_INCLUSIVE_TAX ? true : false;
      }
    }
  },
  methods: {
    sanitizer(dbTax: DbTax): RTax {
      const id = dbTax._id;
      delete dbTax._id;
      return { id, ...dbTax };
    }
  }
};

export = TaxesService;
