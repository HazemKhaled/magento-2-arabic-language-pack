import { Context, ServiceSchema } from 'moleculer';
import DbService from '../utilities/mixins/mongo.mixin';
import { Rule, ShipmentPolicy } from '../utilities/types';

const Shipment: ServiceSchema = {
  name: 'shipment',
  mixins: [DbService('shipment')],
  actions: {
    /**
     * Get shipment policies
     *
     * @param {string} id optional
     * @returns
     */
    getShipments: {
      auth: 'Basic',
      cache: { keys: ['id'], ttl: 60 * 60 },
      params: { id: { type: 'string', optional: true } },
      handler(ctx: Context): ShipmentPolicy | ShipmentPolicy[] {
        return (ctx.params.id ? this.adapter.findById(ctx.params.id) : this.adapter.find()).then(
          (data: ShipmentPolicy[]) => this.shipmentTransform(data)
        );
      }
    },
    /**
     * Insert new shipment policies
     *
     * @param {*} ctx
     * @returns
     */
    insertShipment: {
      auth: 'Basic',
      params: {
        name: { type: 'string' },
        countries: {
          type: 'array',
          items: { type: 'string', max: 2, min: 2, pattern: '[A-Z]' }
        },
        rules: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              courier: { type: 'string' },
              delivery_days_min: { type: 'number', convert: true },
              delivery_days_max: { type: 'number', convert: true },
              units_min: { type: 'number', convert: true },
              units_max: { type: 'number', convert: true },
              type: { type: 'enum', values: ['weight', 'price'] },
              cost: { type: 'number', convert: true }
            }
          }
        }
      },
      handler(ctx: Context): ShipmentPolicy {
        // insert to DB
        return this.adapter
          .insert({
            _id: ctx.params.name,
            countries: ctx.params.countries,
            rules: ctx.params.rules
          })
          .then(() => {
            this.broker.cacher.clean(`shipment.**`);
            return this.adapter.findById(ctx.params.name);
          })
          .then((data: ShipmentPolicy) => this.shipmentTransform(data));
      }
    },
    /**
     * Update shipment policies
     *
     * @param {*} ctx
     * @returns
     */
    updateShipment: {
      auth: 'Basic',
      params: {
        id: { type: 'string' },
        countries: { type: 'array', items: { type: 'string', max: 2, min: 2, pattern: '[A-Z]' } },
        rules: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              courier: { type: 'string' },
              delivery_days_min: { type: 'number', convert: true },
              delivery_days_max: { type: 'number', convert: true },
              units_min: { type: 'number', convert: true },
              units_max: { type: 'number', convert: true },
              type: { type: 'enum', values: ['weight', 'price'] },
              cost: { type: 'number', convert: true }
            }
          }
        }
      },
      handler(ctx: Context): ShipmentPolicy {
        // update DB
        return this.adapter
          .updateMany(
            { _id: ctx.params.id },
            {
              $set: {
                countries: ctx.params.countries,
                rules: ctx.params.rules
              }
            }
          )
          .then(() => {
            this.broker.cacher.clean(`shipment.**`);
            return this.adapter.findById(ctx.params.id);
          })
          .then((data: ShipmentPolicy) => this.shipmentTransform(data));
      }
    },
    /**
     * Get shipping cost by country with measure units and item quantity
     *
     * @param {*} ctx
     * @returns
     */
    ruleByCountry: {
      auth: 'Basic',
      cache: { keys: ['country', 'weight', 'price'], ttl: 60 * 60 },
      params: {
        country: { type: 'string' },
        weight: { type: 'number', convert: true },
        price: { type: 'number', convert: true }
      },
      handler(ctx: Context): Rule[] {
        return this.adapter // find policies with matched rules
          .find({
            query: {
              countries: ctx.params.country,
              'rules.units_max': { $gte: parseInt(ctx.params.weight, 10) },
              'rules.units_min': { $lte: parseInt(ctx.params.weight, 10) }
            }
          })
          .then((policies: ShipmentPolicy[]) => {
            // Get all rules
            const rules: Rule[] = policies.reduceRight(
              (accumulator: Rule[], policy: ShipmentPolicy): Rule[] =>
                accumulator.concat(policy.rules),
              []
            );
            return (
              rules
                // Filter rules
                .filter(
                  (rule: Rule) =>
                    rule.units_max >= ctx.params.weight && rule.units_min <= ctx.params.weight
                )
                // Reformat the rules
                .map(rule => ({
                  courier: rule.courier,
                  cost: rule.cost,
                  duration: `${rule.delivery_days_min}-${rule.delivery_days_max}`
                }))
                .sort((a, b) => a.cost - b.cost)
            );
          });
      }
    },
    /**
     * Returns currencies could be filtered with country
     *
     * @param {string} country optional
     * @returns {string[]} string array of couriers
     */
    getCouriers: {
      auth: 'Basic',
      cache: { keys: ['country'], ttl: 60 * 60 },
      params: {
        country: { type: 'string', optional: true, min: 2, max: 2 }
      },
      handler(ctx: Context): string[] {
        const query = ctx.params.country ? { countries: ctx.params.country } : {};
        return this.adapter.find({ query }).then(
          // Get couriers and filter repeated couriers
          (polices: ShipmentPolicy[]) =>
            Array.from(
              new Set(
                polices.reduceRight(
                  (accumulator: string[], policy: ShipmentPolicy): string[] =>
                    accumulator.concat(policy.rules.map((rule: Rule) => rule.courier)),
                  []
                )
              )
            )
        );
      }
    }
  },
  methods: {
    /**
     * change _id to name
     *
     * @param {ShipmentPolicy[]} data
     * @returns
     */
    shipmentTransform(data: ShipmentPolicy[] | ShipmentPolicy): ShipmentPolicy[] | {} {
      if (data === null) {
        return { message: 'No Shipment Policy with This ID Found' };
      }
      if (Array.isArray(data)) {
        return data.map((item: ShipmentPolicy) => ({
          name: item._id,
          countries: item.countries,
          rules: item.rules
        }));
      }
      if (!Array.isArray(data) && typeof data === 'object') {
        data.name = data._id;
        delete data._id;
        return data;
      }
      return [];
    }
  }
};

export = Shipment;
