"use strict";

const ApiGateway = require("moleculer-web");
const { UnAuthorizedError } = ApiGateway.Errors;
const _ = require("lodash");

module.exports = {
	name: "api/rest",
	mixins: [ApiGateway],

	// More info about settings: http://moleculer.services/docs/moleculer-web.html
	settings: {
		port: process.env.PORT || 3000,

		routes: [{
			path: "/api",
			authorization: true,
			whitelist: [
				// Access to any actions in all services under "/api" URL
				"*"
			],
			aliases: {
				// Login
				"POST /users/login": "users.login",

				// Users
				"REST /users": "users",

				// Current user
				"GET /user": "users.me",
				"PUT /user": "users.updateMyself",
			}
		}],
		// Serve assets from "public" folder
		assets: {
			folder: "public"
		}
	},

	methods: {
		/**
		 * Authorize the request
		 *
		 * @param {Context} ctx
		 * @param {Object} route
		 * @param {IncomingRequest} req
		 * @returns {Promise}
		 */
		authorize(ctx, route, req) {
			let token;
			if (req.headers.authorization) {
				let type = req.headers.authorization.split(" ")[0];
				if (type === "Token" || type === "Bearer")
					token = req.headers.authorization.split(" ")[1];
			}

			return this.Promise.resolve(token)
				.then(token => {
					if (token) {
						// Verify JWT token
						return ctx.call("users.resolveToken", { token })
							.then(user => {
								if (user) {
									this.logger.info("Authenticated via JWT: ", user.username);
									// Reduce user fields (it will be transferred to other nodes)
									ctx.meta.user = _.pick(user, ["_id", "username", "email", "image"]);
									ctx.meta.token = token;
								}
								return user;
							})
							.catch(err => {
								// Ignored because we continue processing if user is not exist
								return null;
							});
					}
				})
				.then(user => {
					if (req.$endpoint.action.auth == "required" && !user)
						return this.Promise.reject(new UnAuthorizedError());
				});
		},
	}
};
