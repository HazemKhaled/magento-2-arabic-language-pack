import DbService from '../mixins/mongo.mixin';
import { Rule, ShipmentPolicy } from '../mixins/types/shipment';

const Shipment = {
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
      params: { id: { type: 'string', optional: true } },
      handler(ctx: any) {
        const query = ctx.params.country ? { countries: ctx.params.country } : {};
        return this.adapter.find({ query });
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
        id: { type: 'string' },
        countries: {
          type: 'array',
          items: { type: 'string', max: 2, min: 2, pattern: '[A-Z]' }
        },
        odoo_id: { type: 'number', convert: true },
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
              type: { type: 'string' },
              cost: { type: 'number', convert: true }
            }
          }
        }
      },
      handler(ctx: any) {
        // insert to DB
        return this.adapter.insert({
          entity: {
            _id: ctx.params.id,
            countries: ctx.params.countries,
            odoo_id: ctx.params.odoo_id,
            rules: ctx.params.rules
          }
        });
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
        odoo_id: { type: 'number', convert: true },
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
              type: { type: 'string' },
              cost: { type: 'number', convert: true }
            }
          }
        }
      },
      handler(ctx: any) {
        // update DB
        return this.adapter.update({
          _id: ctx.params.id,
          odoo_id: ctx.params.odoo_id,
          countries: ctx.params.countries,
          rules: ctx.params.rules
        });
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
      params: {
        country: { type: 'string' },
        wieght: { type: 'number', convert: true },
        price: { type: 'number', convert: true }
      },
      handler(ctx: any) {
        return this.adapter // find policies with matched rules
          .find({
            query: {
              countries: ctx.params.country,
              'rules.units_max': { $gte: parseInt(ctx.params.unit, 10) },
              'rules.units_min': { $lte: parseInt(ctx.params.unit, 10) }
            }
          })
          .then((policies: ShipmentPolicy[]) => {
            // Get all rules
            const rules: Rule[] = policies.reduceRight(
              (accumulator: Rule[], policy: ShipmentPolicy): Rule[] =>
                accumulator.concat(
                  policy.rules.map(rule => ({ ...rule, odoo_id: policy.odoo_id }))
                ),
              []
            );
            return (
              rules
                // Filter rules
                .filter(
                  (rule: Rule) =>
                    rule.units_max >= ctx.params.unit && rule.units_min <= ctx.params.unit
                )
                // Reformat the rules
                .map(rule => ({
                  courier: rule.courier,
                  cost: rule.cost,
                  duration: `${rule.delivery_days_min}-${rule.delivery_days_max}`,
                  odoo_id: rule.odoo_id
                }))
                .sort((a, b) => a.cost - b.cost)
            );
          });
      }
    },
    /**
     * Returns curiers could be filtered with country
     *
     * @param {string} country optional
     * @returns {string[]} string array of couriers
     */
    getCouriers: {
      auth: 'Basic',
      params: {
        country: { type: 'string', optional: true, min: 2, max: 2 }
      },
      handler(ctx: any) {
        const query = ctx.params.country ? { countries: ctx.params.country } : {};
        return this.adapter.find({ query }).then(
          // Get couriers and filter repeated couriers
          (polices: ShipmentPolicy[]) =>
            new Set(
              polices.reduceRight(
                (accumulator: string[], policy: ShipmentPolicy): string[] =>
                  accumulator.concat(policy.rules.map((rule: Rule) => rule.courier)),
                []
              )
            )
        );
      }
    }
  }
};

export = Shipment;
