import { ServiceSchema } from 'moleculer';

import { OrderItem, Product, Store, Variation } from '../types';
import { Rule } from '../types/shipment.type';

export const OrdersOperations: ServiceSchema = {
  name: 'orders-operations',
  methods: {
    /**
     * Check Ordered Items Status inStock And Quantities ...
     *
     * @param {OrderItem[]} items
     * @returns {Promise<{
     *       products: Array<{ _source: Product; _id: string }>;
     *       inStock: OrderItem[];
     *       enoughStock: OrderItem[];
     *       items: OrderItem[];
     *       orderItems: string[];
     *       outOfStock: OrderItem[];
     *       notEnoughStock: OrderItem[];
     *       notKnawat: OrderItem[];
     *     }>}
     */
    async stockProducts(
      items: OrderItem[],
    ): Promise<{
      products: Array<{ _source: Product; _id: string }>;
      inStock: OrderItem[];
      enoughStock: OrderItem[];
      items: OrderItem[];
      orderItems: string[];
      outOfStock: OrderItem[];
      notEnoughStock: OrderItem[];
      notKnawat: OrderItem[];
    }> {
      const orderItems = items.map(item => item.sku);

      // get the products from DB
      const products: [{ _source: Product; _id: string }] = await this.broker.call(
        'products-list.getProductsByVariationSku',
        {
          skus: orderItems,
        },
      );

      const found: OrderItem[] = [];

      // Filter Knawat products and reformat the items data
      products.forEach(product => {
        found.push(
          ...product._source.variations
            .filter((variation: Variation) => orderItems.includes(variation.sku))
            .map(item => ({
              sku: item.sku,
              quantity: item.quantity,
              name: product._source.name.en
                ? product._source.name.en.text
                : product._source.name.tr.text,
              url: product._source.source_url,
              rate: item.sale,
              purchaseRate: item.cost,
              vendorId: product._source.seller_id,
              image: product._source.images[0],
              weight: item.weight,
              archive: product._source.archive,
              barcode: product._source.barcode,
              taxClass: product._source.tax_class,
              description: `${item.attributes.reduce(
                (accumulator, attribute, n) =>
                  accumulator.concat(
                    `${n > 0 ? '\n' : ''}${attribute.name.en || attribute.name.tr}: ${attribute
                      .option.en || attribute.option.tr}`,
                  ),
                '',
              )}`,
            })),
        );
      });

      // Filter not Knawat products alone
      const notKnawat = items.filter(
        (item: OrderItem) => !found.map((i: OrderItem) => i.sku).includes(item.sku),
      );

      // filter not archived products
      const inStock = found.filter(item => item.quantity > 0 && !item.archive);

      // filter products with enough stock
      const enoughStock = inStock.filter(
        item => item.quantity > items.find(i => i.sku === item.sku && !item.archive).quantity,
      );

      // Filter products with out of stock put it into Object with sku is the key for every item to remove duplicated data
      const outOfStockObject: { [key: string]: OrderItem } = {};
      found.forEach((item: OrderItem) => {
        if (item.archive) outOfStockObject[item.sku] = item;
      });

      // filter the data will be sent to oms
      const dataItems: OrderItem[] = [];
      items.forEach(item => {
        const [p] = found.filter(i => i.sku === item.sku);
        if (!p) return;
        delete p.archive;
        dataItems.push({ ...p, quantity: Number(item.quantity) });
      });

      // reform outOfStock to array of {}
      const outOfStock = Object.keys(outOfStockObject).map(key => ({
        ...outOfStockObject[key],
        quantityRequired: items.find(i => i.sku === key).quantity,
      }));

      // Filter products with not enough qty it into Object with sku is the key for every item to remove duplicated data
      const notEnoughStockObject: { [key: string]: OrderItem } = {};
      inStock.forEach((item: OrderItem) => {
        if (!enoughStock.map((i: OrderItem) => i.sku).includes(item.sku)) {
          notEnoughStockObject[item.sku] = item;
        }
      });

      // reform not enough to array of {}
      const notEnoughStock: OrderItem[] = Object.keys(notEnoughStockObject).map(key => ({
        ...notEnoughStockObject[key],
        quantityRequired: items.find(i => i.sku === key).quantity,
      }));

      // return all data
      return {
        products,
        inStock,
        enoughStock,
        items: dataItems,
        orderItems,
        outOfStock,
        notEnoughStock,
        notKnawat,
      };
    },

    /**
     * Calculates the shipment cost according to the store priority
     *
     * @param {OrderItem[]} items
     * @param {string} country
     * @param {Store} instance
     * @param {string} [providedMethod]
     * @returns {Promise<Rule>}
     */
    async shipment(
      items: OrderItem[],
      country: string,
      instance: Store,
      providedMethod?: string,
    ): Promise<Rule> {
      const shipmentWeight =
        items.reduce(
          (accumulator, item) => (accumulator = accumulator + item.weight * item.quantity),
          0,
        ) * 1000;
      const shipmentRules: Rule[] = await this.broker
        .call('shipment.ruleByCountry', {
          country,
          weight: shipmentWeight,
          price: 1,
        })
        .then((rules: Rule[]) => rules.sort((a: Rule, b: Rule) => a.cost - b.cost));

      // find shipment policy according to store priorities
      let shipment: Rule;
      if (providedMethod) {
        shipment = shipmentRules.find(rule => rule.courier === providedMethod) || undefined;
      }
      if (instance.shipping_methods && instance.shipping_methods.length > 0 && !shipment) {
        const sortedShippingMethods = instance.shipping_methods.sort((a, b) => a.sort - b.sort);
        const shipmentMethod = sortedShippingMethods.reduceRight(
          (accumulator, method) =>
            accumulator.concat(
              shipmentRules.find((rule: Rule) => rule.courier === method.name) || [],
            ),
          [],
        );
        shipment =
          shipmentMethod.length > 0
            ? shipmentMethod[shipmentMethod.length - 1]
            : shipmentRules.length > 0
              ? shipmentRules.sort((a: Rule, b: Rule) => a.cost - b.cost)[0]
              : false;
      }

      if (!shipment) {
        [shipment] = shipmentRules;
      }

      return shipment;
    },
  },
};
