/**
 * Shipment Policy
 *
 * @export
 * @interface ShipmentPolicy
 */
export interface ShipmentPolicy {
  _id: string;
  countries: string[];
  odoo_id: number;
  rules: Rule[];
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
  odoo_id?: number; // for rules action return
}
