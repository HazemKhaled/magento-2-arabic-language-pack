import { ServiceSchema } from 'moleculer';

import { OrderLine, Product, Store, Variation } from '../types';
import { Rule } from '../types/shipment.type';

export const OrdersOperations: ServiceSchema = {
  name: 'orders-operations',
  methods: {
    /**
     * Check Ordered Items Status inStock And Quatities ...
     *
     * @param {OrderLine[]} items
     * @returns {products, inStock, enoughStock, items, orderItems}
     */
    async stockProducts(
      items: OrderLine[]
    ): Promise<{
      products: Product[];
      inStock: OrderLine[];
      enoughStock: OrderLine[];
      items: OrderLine[];
      orderItems: string[];
    }> {
      const orderItems = items.map(item => item.sku);
      const products = await this.broker.call('products-list.getProductsByVariationSku', {
        skus: orderItems
      });
      const found: OrderLine[] = [];
      products.forEach((product: { _source: Product }) =>
        found.push(
          ...product._source.variations
            .filter((variation: Variation) => orderItems.includes(variation.sku))
            .map(item => ({ sku: item.sku, quantity: item.quantity }))
        )
      );
      const inStock = found.filter(item => item.quantity > 0);
      const enoughStock = found.filter(
        item => item.quantity > items.find(i => i.sku === item.sku).quantity
      );
      const dataItems = items.filter(item => enoughStock.map(i => i.sku).includes(item.sku));
      return { products, inStock, enoughStock, items: dataItems, orderItems };
    },
    /**
     * Calculates the shipment cost according to the store priority
     *
     * @param {Array<{ _source: Product }>} products
     * @param {OrderLine[]} enoughStock
     * @param {string} country
     * @param {Store} instance
     * @returns {Rule | false}
     */
    async shipment(
      products: Array<{ _source: Product }>,
      enoughStock: OrderLine[],
      country: string,
      instance: Store,
      providedMethod: string | boolean = false
    ): Promise<Rule | boolean> {
      let shipmentWeight = 0;
      products.forEach(
        product =>
          (shipmentWeight = product._source.variations
            .filter(variation => enoughStock.map(i => i.sku).includes(variation.sku))
            .reduce(
              (previous, current) => (previous = previous + current.weight * current.quantity),
              0
            ))
      );
      const shipmentRules = await this.broker
        .call('shipment.ruleByCountry', {
          country,
          weight: shipmentWeight,
          price: 1
        })
        .then((rules: Rule[]) => rules.sort((a: Rule, b: Rule) => a.cost - b.cost));
      // find shipment policy according to store priorities
      let shipment = false;
      if (providedMethod) {
        shipment = shipmentRules.find((rule: Rule) => rule.courier === providedMethod) || false;
      }
      if (instance.shipping_methods && instance.shipping_methods.length > 0 && !shipment) {
        const sortedShippingMethods = instance.shipping_methods.sort((a, b) => a.sort - b.sort);
        const shipmentMethod = sortedShippingMethods.reduceRight(
          (accumulator, method) =>
            accumulator.concat(
              shipmentRules.find((rule: Rule) => rule.courier === method.name) || []
            ),
          []
        );
        shipment =
          shipmentMethod.length > 0
            ? shipmentMethod[shipmentMethod.length - 1]
            : shipmentRules.length > 0
            ? shipmentRules.sort((a: Rule, b: Rule) => a.cost - b.cost)[0]
            : false;
      }
      if (!shipment) {
        shipment = shipmentRules[0] || false;
      }
      return shipment;
    }
  }
};