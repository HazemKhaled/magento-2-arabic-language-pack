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
    this.indices = { products: 'products', categories: 'categories', proinstances: 'products-instances' };
    this.types = { products: 'Product', categories: 'Category', proinstances: 'product' };

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
   * Get Categories from ElasticSearch
   *
   * @returns {Array} Categories
   * @memberof ElasticLib
   */
  async fetchCategories() {
    try {
      const result = await this.es.search({
        index: this.indices.categories,
        type: this.types.categories,
        body: {
          size: 999
        }
      });
      if (result.hits.total === 0) {
        return {
          status: 'failed',
          message: 'There are no categories at the moment.'
        };
      }
      let categories = result.hits.hits;
      categories = categories.map(category => {
        category = category._source;
        return {
          id: category.odooId,
          name: category.name
        };
      });
      return categories;
    } catch (err) {
      return new MoleculerClientError(err);
    }
  }

  /**
   * Get Product By SKU
   *
   * @param {Object} instance
   * @returns {Object} Product
   * @memberof ElasticLib
   */
  async fetchProduct(sku, id) {
    const api = new KlayerAPI();
    let instance = await api.findInstance(id);
    instance = instance['0'];

    try {
      const result = await this.es.search({
        index: this.indices.products,
        type: this.types.products,
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
   * Get products by instance
   *
   * @param {Number} page
   * @param {Number} limit
   * @returns {Array} Products
   * @memberof ElasticLib
   */
  async findProducts(page, _size, id) {
    const api = new KlayerAPI();
    let instance = await api.findInstance(id);
    instance = instance['0'];

    const from = 0;
    const size = _size || 10;
    page = parseInt(page, 10) === 1 ? from : size * page;

    const instanceProducts = await this.findIP(page, size, instance);

    try {
      const search = await this.es.search({
        index: this.indices.products,
        type: this.types.products,
        from: page || 0,
        size: size,
        body: {
          query: {
            ids: {
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
   * Get Products-Instances by Instance Hash
   *
   * @param {Object} instance
   * @param {Number} page
   * @returns {Array} Instance Products
   * @memberof ElasticLib
   */
  async findIP(page, _size, instance) {
    const size = _size || 10;

    try {
      const search = await this.es.search({
        index: this.indices.proinstances,
        type: this.types.proinstances,
        from: page || 0,
        size: size,
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
   * Format Variations
   *
   * @param {Array} variations
   * @param {Object} instance
   * @param {Number} rate
   * @returns {Array} Transformed Variations
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
                : (variation.sale * rate) + instance.salePrice,
            market_price:
              instance.comparedAtPriceOprator === 1
                ? variation.sale * instance.comparedAtPrice * rate
                : (variation.sale * rate) + instance.comparedAtPrice,
            weight: variation.weight,
            attributes: await this.formatAttributes(variation.attributes)
          };
        }
      });
      return variations;
    }
  }

  /**
   * Format Categories
   *
   * @param {Array} categories
   * @returns {Array} Categories
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
   * Format Attributes
   *
   * @param {Array} attributes
   * @returns {Array} Formatted Attributes
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
