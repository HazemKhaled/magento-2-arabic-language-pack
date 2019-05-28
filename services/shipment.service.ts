import DbService from '../mixins/mongo.mixin';
import { Rule, ShipmentPolicy } from '../mixins/types/shipment';

const Shipment = {
  name: 'shipment',
  mixins: [DbService('shipment')],
  actions: {
    /**
     * Insert new shipment policies
     *
     * @param {*} ctx
     * @returns
     */
    insertShipment: {
      params: {
        id: { type: 'string' },
        countries: { type: 'array', items: { type: 'string', max: 2, min: 2 } },
        odoo_id: { type: 'number', convert: true, optional: true },
        rules: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              courier: { type: 'string' },
              delivery_days_min: { type: 'number', convert: true },
              delivery_days_max: { type: 'number', convert: true },
              delivery_items_min: { type: 'number', convert: true },
              delivery_items_max: { type: 'number', convert: true },
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
        return ctx.call('shipment.insert', {
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
      params: {
        id: { type: 'string' },
        countries: { type: 'array', items: { type: 'string', max: 2, min: 2 } },
        odoo_id: { type: 'number', convert: true, optional: true },
        rules: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              courier: { type: 'string' },
              delivery_days_min: { type: 'number', convert: true },
              delivery_days_max: { type: 'number', convert: true },
              delivery_items_min: { type: 'number', convert: true },
              delivery_items_max: { type: 'number', convert: true },
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
        return ctx.call('shipment.update', {
          _id: ctx.params.id,
          odoo_id: ctx.params.odoo_id,
          countries: ctx.params.countries,
          rules: ctx.params.rules
        });
      }
    },
    /**
     * Bulk insert shipment policies
     *
     * @param {*} ctx
     * @returns
     */
    patchShipment: {
      params: {
        entries: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              id: { type: 'string' },
              countries: { type: 'array', items: { type: 'string', max: 2, min: 2 } },
              odoo_id: { type: 'number', convert: true, optional: true },
              rules: {
                type: 'array',
                items: {
                  type: 'object',
                  props: {
                    courier: { type: 'string' },
                    delivery_days_min: { type: 'number', convert: true },
                    delivery_days_max: { type: 'number', convert: true },
                    delivery_items_min: { type: 'number', convert: true },
                    delivery_items_max: { type: 'number', convert: true },
                    units_min: { type: 'number', convert: true },
                    units_max: { type: 'number', convert: true },
                    type: { type: 'string' },
                    cost: { type: 'number', convert: true }
                  }
                }
              }
            }
          }
        }
      },
      handler(ctx: any) {
        // bulk insert to DB
        ctx.call('shipment.insert', {
          entities: ctx.params.entries.map((item: ShipmentPolicy) => ({
            _id: item.id,
            odoo_id: item.odoo_id,
            countries: item.countries,
            rules: item.rules
          }))
        });
      }
    },
    /**
     * Get shipping cost by country with measure units and item quantity
     *
     * @param {*} ctx
     * @returns
     */
    calcByCountry: {
      params: {
        country: { type: 'string' },
        unit: { type: 'number', convert: true },
        delivery_items: { type: 'number', convert: true },
        type: { type: 'string' }
      },
      handler(ctx: any) {
        return (
          ctx
            // find policies with matched rules
            .call('shipment.find', {
              query: {
                countries: ctx.params.country,
                'rules.units_max': { $gte: parseInt(ctx.params.unit, 10) },
                'rules.units_min': { $lte: parseInt(ctx.params.unit, 10) },
                'rules.delivery_items_min': { $lte: parseInt(ctx.params.delivery_items, 10) },
                'rules.delivery_items_max': { $gte: parseInt(ctx.params.delivery_items, 10) },
                'rules.type': ctx.params.type
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
            })
        );
      }
    },
    /**
     * Returns curiers could be filtered with country
     *
     * @param {string} country optional
     * @returns {string[]} string array of couriers
     */
    getCouriers: {
      params: {
        country: { type: 'string', optional: true, min: 2, max: 2 }
      },
      handler(ctx: any) {
        const query = ctx.params.country ? { countries: ctx.params.country } : {};
        return ctx.call('shipment.find', { query }).then(
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
