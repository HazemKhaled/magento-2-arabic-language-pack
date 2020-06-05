/**
 * Shipment Policy
 *
 * @export
 * @interface ShipmentPolicy
 */
export interface ShipmentPolicy {
  _id: string;
  name?: string;
  countries: string[];
  rules: Rule[];
  createdAt: Date;
  updatedAt: Date;
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
}
