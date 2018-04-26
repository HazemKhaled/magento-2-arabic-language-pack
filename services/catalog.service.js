"use strict";

module.exports = {
	name: "catalog",

	/**
	 * Service settings
	 */
	settings: {

	},

	/**
	 * Service metadata
	 */
	metadata: {

	},

	/**
	 * Service dependencies
	 */
	//dependencies: [],	

	/**
	 * Actions
	 */
	actions: {

		/**
		 * Get product by SKU
		 *
		 * @returns
		 */
		product(ctx) {
			if (Object.keys(ctx.params).length > 0) {
				console.log("Putin de ctx", ctx.params);
				return `Welcome, ${ctx.params.name}`;
			} else {
				return {
					"errorCode": 404,
					"errorMessage": "SKU(s) out of stock.",
					"data": {}
				};
			}
		},

		/**
		 * Welcome a username
		 *
		 * @param {String} name - User name
		 */
		products: {
			auth: "required",
			handler() {
				return "Welcome, idiot";
			}			
		},
	},

	/**
	 * Events
	 */
	events: {

	},

	/**
	 * Methods
	 */
	methods: {

	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {

	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {

	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {

	}
};