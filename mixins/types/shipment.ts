/**
 * shipment type
 *
 * @export
 * @interface ShipmentPolicy
 */
export interface ShipmentPolicy {
  id: string;
  countries: string[];
  odoo_id: number;
  rules: Rule[];
}

/**
 * rules type
 *
 * @export
 * @interface Rules
 */
export interface Rule {
  courier: string;
  delivery_days_min: number;
  delivery_days_max: number;
  delivery_items_min: number;
  delivery_items_max: number;
  units_min: number;
  units_max: number;
  type: string;
  cost: number;
  odoo_id?: number;
}
