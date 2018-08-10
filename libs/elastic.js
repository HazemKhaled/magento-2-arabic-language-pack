const elasticsearch = require('elasticsearch');
const Loop = require('bluebird');
const { MoleculerClientError } = require('moleculer').Errors;

const KlayerAPI = require('./klayer');
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
    this.indices = {
      products: 'products',
      categories: 'categories',
      proinstances: 'products-instances'
    };
    this.types = { products: 'Product', categories: 'Category', proinstances: 'product' };

    this.es = new elasticsearch.Client({
      host: [
        {
          host: process.env.ELASTIC_HOST,
          auth: process.env.ELASTIC_AUTH,
          protocol: process.env.ELASTIC_PROTOCOL || 'http',
          port: process.env.ELASTIC_PORT || 9200
        }
      ],
      log: process.env.ELASTIC_LOG || 'info'
    });
  }

  /**
   * Get Categories from ElasticSearch
   *
   * @returns {Array} Categories
   * @memberof ElasticLib
   */
  fetchCategories() {
    return this.es
      .search({
        index: this.indices.categories,
        type: this.types.categories,
        body: {
          size: 999
        }
      })
      .then(result => {
        if (result.hits.total === 0) {
          return {
            status: 'failed',
            message: 'There are no categories at the moment.'
          };
        }

        return result.hits.hits.map(category => {
          category = category._source;
          return {
            id: category.odooId,
            name: this.formatI18nText(category.name)
          };
        });
      })
      .catch(err => new MoleculerClientError(err));
  }

  /**
   * Get Product By SKU
   *
   * @param {Object} instance
   * @returns {Object} Product
   * @memberof ElasticLib
   */
  async fetchProduct(sku, id, _source) {
    const api = new KlayerAPI();
    const [instance] = await api.findInstance(id);

    try {
      const result = await this.es.search({
        index: this.indices.products,
        type: this.types.products,
        _source: _source,
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
        name: this.formatI18nText(source.name),
        description: this.formatI18nText(source.description),
        last_check_date: source.last_check_date,
        supplier: source.seller_id,
        images: source.images,
        categories: await this.formatCategories(source.categories),
        attributes: await this.formatAttributes(source.attributes),
        variations: await this.formatVariations(source.variations, instance, rate)
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
  async findProducts(page, _size, id, _source) {
    const api = new KlayerAPI();
    const [instance] = await api.findInstance(id);

    const size = _size || 10;

    const instanceProducts = await this.findIP(page, size, instance);
    if (instanceProducts.length === 0) {
      return instanceProducts;
    }
    try {
      const search = await this.es.mget({
        index: this.indices.products,
        type: this.types.products,
        _source: _source,
        body: {
          ids: instanceProducts
        }
      });

      const results = search.docs;

      const rate = await api.currencyRate(instance.base_currency);
      try {
        let products = await Loop.map(results, async product => {
          if (product.found) {
            const source = product._source;
            return {
              sku: source.sku,
              name: this.formatI18nText(source.name),
              description: this.formatI18nText(source.description),
              supplier: source.seller_id,
              images: source.images,
              last_check_date: source.last_check_date,
              categories: await this.formatCategories(source.categories),
              attributes: await this.formatAttributes(source.attributes),
              variations: await this.formatVariations(source.variations, instance, rate)
            };
          }
        });
        products = products.filter(product => !!product && product.variations.length !== 0);
        return products;
      } catch (err) {
        return new MoleculerClientError(err);
      }
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
        from: parseInt(page) === 1 ? 0 : page * size || 0,
        size: parseInt(size),
        body: {
          sort: [{ createdAt: { order: 'asc' } }],
          query: {
            match: {
              instanceId: instance.webhook_hash
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
          const cost = parseFloat((variation.sale * rate).toFixed(2));

          return {
            sku: variation.sku,
            cost_price: cost,
            sale_price: this.formatPrice(cost, instance.salePriceOprator, instance.salePrice),
            market_price: this.formatPrice(cost, instance.salePriceOprator, instance.salePrice),
            sale_price1:
              instance.salePriceOprator === 1
                ? variation.sale * instance.salePrice * rate
                : variation.sale * rate + instance.salePrice,
            market_price1:
              instance.comparedAtPriceOprator === 1
                ? variation.sale * instance.comparedAtPrice * rate
                : variation.sale * rate + instance.comparedAtPrice,
            weight: variation.weight,
            attributes: await this.formatAttributes(variation.attributes),
            quantity: variation.quantity
          };
        }
      });
      return variations;
    }
  }

  /**
   *
   *
   * @param {*} params
   * @returns
   * @memberof ElasticLib
   */
  formatPrice(cost, salePriceOprator, salePrice) {
    const result = salePriceOprator === 1 ? cost * salePrice : cost + salePrice;
    return parseFloat((cost + result / 100).toFixed(2));
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
            name: this.formatI18nText(category.name_i18n)
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
              en: attribute.name
            },
            option: {
              en: attribute.option
            }
          };
        }
      });
      return attributes;
    }
  }

  /**
   * Pick only language keys
   *
   * @param {Object} obj
   * @returns
   * @memberof ElasticLib
   */
  formatI18nText(obj) {
    if (!obj) return;

    const output = {};

    ['ar', 'en', 'tr', 'fr'].forEach(key => {
      if (obj[key] && key.length === 2) {
        output[key] = typeof obj[key] === 'string' ? obj[key] : obj[key].text;
      }
    });

    // Cleanup null values
    Object.keys(output).forEach(k => {
      if (!output[k]) delete output[k];
    });

    return Object.keys(output).length ? output : false;
  }
}

module.exports = ElasticLib;
