"use strict";

class KlayerLib {

	constructor() {
		this.request = require("request-promise");
		this.access_token = process.env.TOKEN || "dbbf3cb7-f7ad-46ce-bee3-4fd7477951c4";
		this.API_URL = process.env.API_URL || "https://api.knawat.com";
	}

	async findInstance(ck) {
		try {
			const instance = await this.request({
				method: "get",
				uri: this.getUrl('Instances?filter=' + JSON.stringify({ "where": { "webhook_hash": ck } })),
				qs: {
					access_token: this.access_token
				},
				headers: {
					"User-Agent": "Request-Middleware",
				},
				json: true
			});
			return instance;
		} catch (err) {
			return err;
		}
	}

	async updateInstance(instance) {
		try {
			const update = await this.request({
				method: "PATCH",
				uri: this.getUrl("Instances"),
				qs: {
					access_token: this.access_token
				},
				headers: {
					"User-Agent": "Request-Middleware",
				},
				body: instance,
				json: true
			});
			return update;
		} catch (err) {
			return err.message;
		}
	}

	async currencyRate(id) {
		try {
			const currency = await this.request({
				method: "GET",
				uri: this.getUrl("Currencies/" + id),
				qs: {
					access_token: this.access_token
				},
				headers: {
					"User-Agent": "Request-Middleware",
				},
				json: true
			});
			return currency.rate;
		} catch (err) {
			return err.message;
		}
	}

	getUrl(endpoint) {
		// if URL doesn't have / at the end add it
		let url = "/" === this.API_URL.slice(-1) ? this.API_URL : this.API_URL + "/";
		// Add API base
		const api = "api/";
		// Concat the final URL
		url = url + api + endpoint;
		return url;
	};

}

module.exports = KlayerLib;