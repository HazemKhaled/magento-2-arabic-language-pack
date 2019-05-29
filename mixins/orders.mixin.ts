import { OrderLine, Product, Store, Variation } from './types';
import { Rule } from './types/shipment';

export const OrdersOperations = {
  name: 'orders-operations',
  methods: {
    /**
     *
     *
     * @param {OrderLine[]} items
     * @returns {products, inStock, enoughStock}
     */
    async stockProducts(items: OrderLine[]) {
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
     *
     *
     * @param {Array<{ _source: Product }>} products
     * @param {OrderLine[]} enoughStock
     * @param {string} country
     * @param {Store} instance
     * @returns {shipment}
     */
    async shipment(
      products: Array<{ _source: Product }>,
      enoughStock: OrderLine[],
      country: string,
      instance: Store
    ) {
      let shipmentWieght = 0;
      products.forEach(
        product =>
          (shipmentWieght = product._source.variations
            .filter(variation => enoughStock.map(i => i.sku).includes(variation.sku))
            .reduce(
              (previous, current) => (previous = previous + current.weight * current.quantity),
              0
            ))
      );
      const shipmentRules = await this.broker.call('shipment.ruleByCountry', {
        country,
        weight: shipmentWieght,
        price: 1
      });

      // find shipment policy according to store priorities
      let shipment = false;
      if (instance.shipping_methods && instance.shipping_methods.length > 0) {
        const sortedShippingMethods = instance.shipping_methods.sort((a, b) => a.sort - b.sort);
        const shipmentMethod = sortedShippingMethods.reduceRight(
          (accumulator, method) =>
            accumulator.concat(
              shipmentRules.find((rule: Rule) => rule.courier === method.name) || []
            ),
          []
        );
        shipment = shipmentMethod.length > 0 ? shipmentMethod[0] : false;
      }
      return shipment;
    }
  }
};
