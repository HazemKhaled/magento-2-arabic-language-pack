/**
 * Shipment Policy
 *
 * @export
 * @interface ShipmentPolicy
 */
export interface ShipmentPolicy {
  _id: string;
  id?: string;
  name?: string;
  countries: string[];
  rules: Rule[];
  createdAt: Date;
  updatedAt: Date;
  country?: string;
  weight?: number;
  ship_from?: string;
}

/**
 * Rules
 *
 * @export
 * @interface Rules
 */
export interface Rule {
  courier: string;
  delivery_days_min: number;
  delivery_days_max: number;
  units_min: number;
  units_max: number;
  type: string;
  cost: number;
  duration?: string;
}

/**
 * RuleParms
 *
 * @export
 * @interface RuleParms
 */
export interface RuleParms {
  country: string;
  weight: number;
  price: number;
  ship_from_city?: string;
  ship_from_country?: string;
}

/**
 * Mongodb RuleQuery schema
 *
 * @export
 * @interface RuleQuery
 */
export interface RuleQuery {
  countries: string;
  'rules.units_max': { $gte: number };
  'rules.units_min': { $lte: number };
  'ship_from.city'?: { $in: string[] };
  'ship_from.country'?: { $in: string[] };
}
