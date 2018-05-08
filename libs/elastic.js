const elasticsearch = require('elasticsearch');
const KlayerAPI = require('./klayer');
const Loop = require('bluebird');
const { MoleculerClientError } = require('moleculer').Errors;

/**
 * Elasticsearch interface
 *
 * @class ElasticLib
 */
class ElasticLib {
  /**
   * Creates an instance of ElasticLib.
   * @memberof ElasticLib
   */
  constructor() {
    // Indexes & types
    this.indeces = { products: 'products', categories: 'categories' };
    this.types = { products: 'Product', categories: 'Category' };

    this.es = new elasticsearch.Client({
      host: [
        {
          host: process.env.ELASTIC_HOST || 'elastic.knawat.com',
          auth: process.env.ELASTIC_AUTH || 'admin:C7ywZQoZ99avzbnmh7Q7hxPqt',
          protocol: 'http',
          port: process.env.ELASTIC_PORT || 9200
        }
      ],
      log: process.env.LOG || 'error'
    });
  }

  /**
   *
   *
   * @param {any} indexName
   * @param {any} type
   * @param {any} page
   * @returns
   * @memberof ElasticLib
   */
  async fetch(indexName, type, page) {
    const from = 0;
    const size = 1000;
    let pages;
    if (page === undefined) {
      pages = { from: 0, size: 10 };
    } else {
      pages = { from: page === 1 ? from : size * page, size: size };
    }

    try {
      const result = await this.es.search({
        index: indexName,
        type: type,
        body: pages
      });
      if (result.hits.total === 0) {
        return {
          status: 'failed',
          message: 'There are no products at the moment.'
        };
      }
      let products = result.hits.hits;
      products = products.map(product => product._source);
      return products;
    } catch (err) {
      return err;
    }
  }

  /**
   *
   *
   * @param {any} indexName
   * @param {any} type
   * @param {any} sku
   * @param {any} instance
   * @returns
   * @memberof ElasticLib
   */
  async fetchProduct(indexName, type, sku, instance) {
    const api = new KlayerAPI();
    try {
      const result = await this.es.search({
        index: indexName,
        type: type,
        body: {
          query: {
            term: {
              sku: sku
            }
          }
        }
      });
      if (result.hits.total === 0) {
        return {
          status: 'failed',
          message: 'Product not found',
          sku: sku
        };
      }
      const rate = await api.currencyRate(instance.base_currency);
      const source = result.hits.hits[0]._source;
      return {
        sku: source.sku,
        name: source.name,
        description: source.description,
        last_stock_check: source.last_stock_check,
        supplier: source.seller_id,
        images: source.images,
        categories: await this.formatCategories(source.categories),
        attributes: await this.formatAttributes(source.attributes),
        variations: await this.formatVariations(
          source.variations,
          instance,
          rate
        )
      };
    } catch (err) {
      return new Error(err);
    }
  }

  /**
   *
   *
   * @param {any} indexName
   * @param {any} type
   * @param {any} instance
   * @param {any} _page
   * @returns
   * @memberof ElasticLib
   */
  async findIP(indexName, type, instance, _page) {
    const from = 0;
    const size = 1000;
    const page = _page === 1 ? from : size * _page;

    try {
      const search = await this.es.search({
        index: indexName,
        type: type,
        from: page || 0,
        size: size || 10,
        body: {
          query: {
            term: {
              'instanceId.keyword': instance.webhook_hash
            }
          }
        }
      });
      const results = search.hits.hits;
      const ids = await Loop.map(results, async product => {
        const source = product._source;
        return source.sku;
      });
      return ids;
    } catch (err) {
      return new MoleculerClientError(err, 500);
    }
  }

  /**
   * Get products by instance
   *
   * @param {any} indexName
   * @param {any} type
   * @param {any} instance
   * @param {any} page
   * @param {any} limit
   * @returns
   * @memberof ElasticLib
   */
  async findProducts(indexName, type, instance, page, limit) {
    const api = new KlayerAPI();
    const from = 0;
    const size = 1000;

    const instanceProducts = await this.findIP(
      'products-instances',
      'product',
      instance,
      page,
      limit
    );

    try {
      const search = await this.es.search({
        index: indexName,
        type: type,
        from: page === undefined ? 0 : page === 1 ? from : size * page,
        size: page === undefined ? 10 : size,
        body: {
          query: {
            ids: {
              type: type,
              values: instanceProducts
            }
          }
        }
      });

      const results = search.hits.hits;

      const rate = await api.currencyRate(instance.base_currency);

      const products = await Loop.map(results, async product => {
        const source = product._source;
        return {
          sku: source.sku,
          name: source.name,
          description: source.description,
          last_stock_check: source.last_stock_check,
          supplier: source.seller_id,
          images: source.images,
          categories: await this.formatCategories(source.categories),
          attributes: await this.formatAttributes(source.attributes),
          variations: await this.formatVariations(
            source.variations,
            instance,
            rate
          )
        };
      });
      return products;
    } catch (err) {
      return new MoleculerClientError(err, 500);
    }
  }

  /**
   *
   *
   * @param {any} variations
   * @param {any} instance
   * @param {any} rate
   * @returns
   * @memberof ElasticLib
   */
  async formatVariations(variations, instance, rate) {
    if (variations) {
      variations = await Loop.map(variations, async variation => {
        if (variation) {
          return {
            sku: variation.sku,
            cost_price: variation.cost * rate,
            sale_price:
              instance.salePriceOprator === 1
                ? variation.sale * instance.salePrice * rate
                : variation.sale * rate + instance.salePrice,
            market_price:
              instance.comparedAtPriceOprator === 1
                ? variation.sale * instance.comparedAtPrice * rate
                : variation.sale * rate + instance.comparedAtPrice,
            weight: variation.weight,
            attributes: await this.formatAttributes(variation.attributes)
          };
        }
      });
      return variations;
    }
  }

  /**
   *
   *
   * @param {any} categories
   * @returns
   * @memberof ElasticLib
   */
  async formatCategories(categories) {
    if (categories) {
      categories = await Loop.map(categories, async category => {
        if (category) {
          return {
            id: category.odooId,
            name: category.name_i18n
          };
        }
      });
      return categories;
    }
  }

  /**
   *
   *
   * @param {any} attributes
   * @returns
   * @memberof ElasticLib
   */
  async formatAttributes(attributes) {
    if (attributes) {
      attributes = await Loop.map(attributes, async attribute => {
        if (attribute) {
          return {
            id: attribute.id,
            name: {
              tr: attribute.name,
              en: '',
              ar: ''
            },
            option: {
              tr: attribute.option,
              en: '',
              ar: ''
            }
          };
        }
      });
      return attributes;
    }
  }
}

module.exports = ElasticLib;
