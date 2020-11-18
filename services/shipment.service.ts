import { Context, ServiceSchema, GenericObject } from 'moleculer';

import DbService from '../utilities/mixins/mongo.mixin';
import { ShipmentOpenapi } from '../utilities/mixins/openapi';
import { Rule, ShipmentPolicy, RuleQuery } from '../utilities/types';
import { ShipmentValidation } from '../utilities/mixins/validation';
import { MpError } from '../utilities/adapters';

const Shipment: ServiceSchema = {
  name: 'shipment',
  mixins: [DbService('shipment'), ShipmentValidation, ShipmentOpenapi],
  actions: {
    /**
     * Get shipment policies
     *
     * @param {string} id optional
     * @returns
     */
    getShipments: {
      auth: ['Basic'],
      cache: { keys: ['id'], ttl: 60 * 60 * 24 * 30 },
      handler(ctx: Context<ShipmentPolicy>): ShipmentPolicy | ShipmentPolicy[] {
        return (ctx.params.id
          ? this.adapter.findById(ctx.params.id)
          : this.adapter.find()
        ).then((data: ShipmentPolicy[]) => this.shipmentTransform(data));
      },
    },
    /**
     * Insert new shipment policies
     *
     * @param {*} ctx
     * @returns
     */
    insertShipment: {
      auth: ['Basic'],
      handler(ctx: Context<ShipmentPolicy>): ShipmentPolicy {
        // insert to DB
        return this.adapter
          .insert({
            _id: ctx.params.name,
            countries: ctx.params.countries,
            rules: ctx.params.rules,
            ship_from: ctx.params.ship_from,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .then(() => {
            this.broker.cacher.clean('shipment.**');
            return this.adapter.findById(ctx.params.name);
          })
          .then((data: ShipmentPolicy) => this.shipmentTransform(data))
          .catch((err: any) => {
            if (err.name === 'MoleculerError') {
              throw new MpError('Shipment Service', err.message, err.code);
            }
            if (err.name === 'MongoError' && err.code === 11000) {
              throw new MpError('Shipment Service', 'Duplicate name!', 422);
            }
            throw new MpError('Shipment Service', err, 500);
          });
      },
    },
    /**
     * Update shipment policies
     *
     * @param {*} ctx
     * @returns
     */
    updateShipment: {
      auth: ['Basic'],
      handler(ctx: Context<ShipmentPolicy>): ShipmentPolicy {
        // update DB
        return this.adapter
          .updateMany(
            { _id: ctx.params.id },
            {
              $set: {
                countries: ctx.params.countries,
                rules: ctx.params.rules,
                ship_from: ctx.params.ship_from,
                updatedAt: new Date(),
              },
            }
          )
          .then(() => {
            this.broker.cacher.clean('shipment.**');
            return this.adapter.findById(ctx.params.id);
          })
          .then((data: ShipmentPolicy) => this.shipmentTransform(data))
          .catch((err: any) => {
            if (err.name === 'MoleculerError') {
              throw new MpError('Shipment Service', err.message, err.code);
            }
            throw new MpError('Shipment Service', err, 500);
          });
      },
    },
    /**
     * Get shipping cost by country with measure units and item quantity
     *
     * @param {*} ctx
     * @returns
     */
    ruleByCountry: {
      auth: ['Basic'],
      cache: {
        keys: [
          'country',
          'weight',
          'price',
          'ship_from_city',
          'ship_from_country',
        ],
        ttl: 60 * 60 * 24 * 30,
      },
      handler(
        ctx: Context<{
          country: string;
          weight: number;
          ship_from_city: string;
          ship_from_country: string;
        }>
      ): Rule[] {
        // find policies with matched rules
        const query: RuleQuery = {
          countries: ctx.params.country,
          'rules.units_max': { $gte: ctx.params.weight },
          'rules.units_min': { $lte: ctx.params.weight },
        };
        if (ctx.params.ship_from_city && ctx.params.ship_from_country) {
          let cityAr: string[] = [];
          let countryAr: string[] = [];
          if (ctx.params.ship_from_city) {
            cityAr = ctx.params.ship_from_city
              .split(',')
              .filter((city: string) => city.trim().length > 0);
          }
          if (ctx.params.ship_from_country) {
            countryAr = ctx.params.ship_from_country
              .split(',')
              .filter((country: string) => country.trim().length > 0);
          }

          // If getting * in city then allow to all city
          if (cityAr.length > 0 && !cityAr.includes('*')) {
            cityAr.push('*'); /* Allow all the city */
            query['ship_from.city'] = { $in: cityAr };
          }
          if (countryAr.length > 0 && !countryAr.includes('ZZ')) {
            countryAr.push('ZZ'); /* Allow all the country */
            query['ship_from.country'] = {
              $in: countryAr,
            };
          }
        }
        return this.adapter
          .find({
            query,
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
                    rule.units_max >= ctx.params.weight &&
                    rule.units_min <= ctx.params.weight
                )
                // Reformat the rules
                .map(rule => ({
                  courier: rule.courier,
                  cost: Number(rule.cost),
                  duration: `${rule.delivery_days_min}-${rule.delivery_days_max}`,
                }))
                .sort((a, b) => a.cost - b.cost)
            );
          })
          .catch((err: any) => {
            if (err.name === 'MoleculerError') {
              throw new MpError('Shipment Service', err.message, err.code);
            }
            throw new MpError('Shipment Service', err, 500);
          });
      },
    },
    /**
     * Returns currencies could be filtered with country
     *
     * @param {string} country optional
     * @returns {string[]} string array of couriers
     */
    getCouriers: {
      auth: ['Basic'],
      cache: { keys: ['country'], ttl: 60 * 60 * 24 * 30 },
      handler(ctx: Context<ShipmentPolicy>): string[] {
        const query = ctx.params.country
          ? { countries: ctx.params.country }
          : {};
        return this.adapter
          .find({ query })
          .then(
            // Get couriers and filter repeated couriers
            (polices: ShipmentPolicy[]) =>
              Array.from(
                new Set(
                  polices.reduceRight(
                    (accumulator: string[], policy: ShipmentPolicy): string[] =>
                      accumulator.concat(
                        policy.rules.map((rule: Rule) => rule.courier)
                      ),
                    []
                  )
                )
              )
          )
          .catch((err: any) => {
            if (err.name === 'MoleculerError') {
              throw new MpError('Shipment Service', err.message, err.code);
            }
            throw new MpError('Shipment Service', err, 500);
          });
      },
    },
  },
  methods: {
    /**
     * change _id to name
     *
     * @param {ShipmentPolicy[]} data
     * @returns
     */
    shipmentTransform(
      data: ShipmentPolicy[] | ShipmentPolicy
    ): ShipmentPolicy[] | unknown {
      if (data === null) {
        return { message: 'No Shipment Policy with This ID Found' };
      }
      if (Array.isArray(data)) {
        return data.map((item: ShipmentPolicy) => ({
          name: item._id,
          countries: item.countries,
          rules: item.rules,
        }));
      }
      if (!Array.isArray(data) && typeof data === 'object') {
        data.name = data._id;
        delete data._id;
        return data;
      }
      return [];
    },
  },
};

export = Shipment;
