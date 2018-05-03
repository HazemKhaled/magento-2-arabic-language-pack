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

	async fetchInstanceProduct(indexName, type, hash, page) {
		let from = 0;
		let size = 1000;

		if (page === undefined) {
			from = 0;
			size = 10;
		} else {
			from = page == 1 ? from : size * page;
		}

		try {
			const result = await this.es.search({
				index: indexName,
				type: type,
				from : from, 
				size : size,
				body: {
					"query": {
						"term": {
							"instanceId": hash
						}
					}
				}
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
			return new Error(err);
		}
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
}

module.exports = ElasticLib;