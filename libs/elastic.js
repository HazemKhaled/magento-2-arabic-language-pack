"use strict";

class ElasticLib {

	constructor() {
		const elasticsearch = require("elasticsearch");
		this.es = new elasticsearch.Client({
			host: [
				{
					host: process.env.HOST || "elastic.knawat.com",
					auth: process.env.AUTH ||"admin:C7ywZQoZ99avzbnmh7Q7hxPqt",
					protocol: "http",
					port: process.env.PORT || 9200,
				}
			],
			log: process.env.LOG || "error"
		});
	}

	async fetch(indexName, type, page) {
		let from = 0;
		let size = 1000;
		let pages;
		if (page === undefined) {
			pages = {"from" : 0, "size" : 10};
		} else {
			pages = {"from" : page == 1 ? from : size * page , "size" : size};
		}

		try {
			const result = await this.es.search({
				index: indexName,
				type: type,
				body: pages
			});
			if (result.hits.total === 0) {
				return {
					status: "failed",
					message: "There are no products at the moment.",
				};
			} else {
				let products = result.hits.hits;
				products = products.map((product) => product._source);
				return products;
			}
		} catch (err) {
			return err;
		}
	}

	async fetchProduct(indexName, type, sku) {
		try {
			const result = await this.es.search({
				index: indexName,
				type: type,
				body: {
					"query": {
						"term": {
							"sku": sku
						}
					}
				}
			});
			if (result.hits.total === 0) {
				return {
					status: "failed",
					message: "Product not found",
					sku: sku,
				};
			} else {
				const product = result.hits.hits[0]._source;
				return product;
			}
		} catch (err) {
			return new Error(err);
		}
	}

	async findIP(indexName, type, instance, page) {
		const Loop = require("bluebird");
		let from = 0;
		let size = 1000;
		console.log(instance.webhook_hash);
		try {
			const search = await this.es.search({
				index: indexName,
				type: type,
				from: page === undefined ? 0 : (page == 1 ? from : size * page),
				size: page === undefined ? 10 : size,
				body: {
					query: {
						term: {
							"instanceId.keyword": instance.webhook_hash,
						}
					}
				},
			});
			const results = search.hits.hits;

			let ids = [];
			const products = await Loop.map(results, async (product) => {
				let source = product._source;
				source._id = product._id;
				ids.push(source.sku);
				return source;
			});
			return [ids, products];
		} catch (err) {
			console.log(err);
			return err;
		}
	}

	async findProducts(indexName, type, instance, page) {
		const KlayerAPI = require("./klayer");
		const api = new KlayerAPI();
		const Loop = require("bluebird");
		let from = 0;
		let size = 1000;
		const instanceProducts = await this.findIP("products-instances", "product", instance, page);

		try {
			const search = await this.es.search({
				index: indexName,
				type: type,
				from: page === undefined ? 0 : (page == 1 ? from : size * page),
				size: page === undefined ? 10 : size,
				body: {
					query: {
						ids: {
							type: type,
							values: instanceProducts[0],
						},                        
					}
				},
			});

			let results = search.hits.hits;
			const rate = await api.currencyRate(instance.base_currency);

			let products = await Loop.map(results, async product => {
				let source = product._source;
				return {
					sku: source.sku,
					name: source.name,
					description: source.description,
					last_stock_check: source.last_stock_check,
					supplier: source.seller_id,
					images: source.images,
					categories: await this.formatCategories(source.categories),
					attributes: source.attributes,
					variations: await this.formatVariations(source.variations, instance, rate),
				};
			});
			return products;
		} catch (err) {
			console.log(err);
			return err;
		}
	}

	async formatVariations(variations, instance, rate) {
		const Loop = require("bluebird");
		variations = await Loop.map(variations, async variation => {
			if (variation) {
				return {
					sku: variation.sku,
					cost_price: variation.cost * rate,
					sale_price: instance.salePriceOprator === 1 ? variation.sale * instance.salePrice * rate : (variation.sale * rate) + instance.salePrice,
					market_price: instance.comparedAtPriceOprator === 1 ? variation.sale * instance.comparedAtPrice * rate : (variation.sale * rate) + instance.comparedAtPrice,
					weight: variation.weight,
					attributes: variation.attributes,
				};
			}
		});
		return variations;
	}

	async formatCategories(categories) {
		const Loop = require("bluebird");
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

	async formatAttributes(attributes) {
		const Loop = require("bluebird");
		attributes = await Loop.map(attributes, async attribute => {
			if (attribute) {
				return {
					id: attribute.id,
					name: {
						tr: attribute.name,
						en: "",
						ar: ""
					},
					option: {
						tr: attribute.option,
						en: "",
						ar: ""
					},
				};
			}
		});
		return attributes;
	}
}

module.exports = ElasticLib;