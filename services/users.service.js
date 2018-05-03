"use strict";

const { MoleculerClientError } = require("moleculer").Errors;

//const crypto 		= require("crypto");
const bcrypt 		= require("bcrypt");
const jwt 			= require("jsonwebtoken");

const DbService = require("../mixins/db.mixin");

module.exports = {
	name: "users",
	mixins: [DbService("users")],

	/**
	 * Default settings
	 */
	settings: {
		/** Secret for JWT */
		JWT_SECRET: process.env.JWT_SECRET || "jwt-conduit-secret",

		/** Public fields */
		fields: ["_id", "username", "email", "bio", "image"],

		/** Validator schema for entity */
		/*entityValidator: {
			username: { type: "string", min: 2, pattern: /^[a-zA-Z0-9]+$/ },
			password: { type: "string", min: 6 },
			consumer_key: {type: "string"},
			consumer_secret: {type: "string"},
			email: { type: "email" },
			bio: { type: "string", optional: true },
			image: { type: "string", optional: true },
		}*/
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Register a new user
		 * 
		 * @actions
		 * @param {Object} user - User entity
		 * 
		 * @returns {Object} Created entity & token
		 */
		create: {
			params: {
				user: { type: "object" }
			},			
			handler(ctx) {
				let entity = ctx.params.user;
				return this.validateEntity(entity)
					.then(() => {
						if (entity.username)
							return this.adapter.findOne({ username: entity.username })
								.then(found => {
									if (found)
										return Promise.reject(new MoleculerClientError("Username is exist!", 422, "", [{ field: "username", message: "is exist"}]));
									
								});
					})
					.then(() => {
						if (entity.email)
							return this.adapter.findOne({ email: entity.email })
								.then(found => {
									if (found)
										return Promise.reject(new MoleculerClientError("Email is exist!", 422, "", [{ field: "email", message: "is exist"}]));
								});
							
					})
					.then(() => {
						entity.password = bcrypt.hashSync(entity.password, 10);
						entity.bio = entity.bio || "";
						entity.image = entity.image || null;
						entity.createdAt = new Date();

						return this.adapter.insert(entity)
							.then(doc => this.transformDocuments(ctx, {}, doc))
							.then(user => this.transformEntity(user, true, ctx.meta.token))
							.then(json => this.entityChanged("created", json, ctx).then(() => json));					
					});
			}
		},

		/**
		 * Login with username & password
		 * 
		 * @actions
		 * @param {Object} user - User credentials
		 * 
		 * @returns {Object} Logged in user with token
		 */
		login: {
			params: {
				user: { type: "object", props: {
					consumer_key: { type: "string" },
					consumer_secret: { type: "string", min: 1 }
				}}
			},
			handler(ctx) {
				const { consumer_key, consumer_secret } = ctx.params;

				return this.Promise.resolve()
					.then(async () => {
						const KlayerLib = require("../libs/klayer");
						const klayer = new KlayerLib();

						try {
							let instance = await klayer.findInstance(consumer_key);
							instance = instance[0];
							if (!instance) {
								return this.Promise.reject(new MoleculerClientError("consumer_key or consumer_secret is invalid!", 422, "", [{ field: "consumer_key", message: "is not found"}]));
							} else {
								return {
									"_id": instance.webhook_hash,
									"url": instance.url,
									"status": instance.status,
									"base_currency": instance.base_currency,
								};
							}
						} catch(err) {
							return this.Promise.reject(new MoleculerClientError(err));
						}
					})
					.then(user => this.transformEntity(user, true, ctx.meta.token));
			}
		},
		/*login: {
			params: {
				user: { type: "object", props: {
					consumer_key: { type: "string" },
					consumer_secret: { type: "string", min: 1 }
				}}
			},
			handler(ctx) {
				const { consumer_key, consumer_secret } = ctx.params.user;
				console.log({ consumer_key, consumer_secret });
				return this.Promise.resolve()
					.then(() => {
						return {
							email: "ok@",
							password: consumer_secret
						};
					})
					.then(user => this.transformEntity(user, true, ctx.meta.token));
			}
		},*/

		/**
		 * Get user by JWT token (for API GW authentication)
		 * 
		 * @actions
		 * @param {String} token - JWT token
		 * 
		 * @returns {Object} Resolved user
		 */
		resolveToken: {
			cache: {
				keys: ["token"],
				ttl: 60 * 60 // 1 hour
			},			
			params: {
				token: "string"
			},
			handler(ctx) {
				return new this.Promise((resolve, reject) => {
					jwt.verify(ctx.params.token, this.settings.JWT_SECRET, (err, decoded) => {
						if (err)
							return reject(err);

						resolve(decoded);
					});

				})
					.then(async (decoded) => {
						const KlayerLib = require("../libs/klayer");
						const klayer = new KlayerLib();
						if (decoded.id) {
							const instance = await klayer.findInstance(decoded.id);
							if (instance[0].status === "confirmed") {
								return true;
							}
						}
					});
			}
		},			
	},

	/**
	 * Methods
	 */
	methods: {
		/**
		 * Generate a JWT token from user entity
		 * 
		 * @param {Object} user 
		 */
		generateJWT(user) {
			const today = new Date();
			const exp = new Date(today);
			exp.setDate(today.getDate() + 60);

			return jwt.sign({
				id: user._id,
				username: user.username,
				exp: Math.floor(exp.getTime() / 1000)
			}, this.settings.JWT_SECRET);
		},

		/**
		 * Transform returned user entity. Generate JWT token if neccessary.
		 * 
		 * @param {Object} user 
		 * @param {Boolean} withToken 
		 */
		transformEntity(user, withToken, token) {
			if (user) {
				//user.image = user.image || "https://www.gravatar.com/avatar/" + crypto.createHash("md5").update(user.email).digest("hex") + "?d=robohash";
				user.image = user.image || "";
				if (withToken)
					user.token = token || this.generateJWT(user);
			}

			return { user };
		},

		/**
		 * Transform returned user entity as profile.
		 * 
		 * @param {Context} ctx
		 * @param {Object} user 
		 * @param {Object?} loggedInUser 
		 */
		transformProfile(ctx, user, loggedInUser) {
			//user.image = user.image || "https://www.gravatar.com/avatar/" + crypto.createHash("md5").update(user.email).digest("hex") + "?d=robohash";
			user.image = user.image || "https://static.productionready.io/images/smiley-cyrus.jpg";

			if (loggedInUser) {
				return ctx.call("follows.has", { user: loggedInUser._id.toString(), follow: user._id.toString() })
					.then(res => {
						user.following = res;
						return { profile: user };
					});
			}

			user.following = false;

			return { profile: user };
		}
	},

	events: {
		"cache.clean.users"() {
			if (this.broker.cacher)
				this.broker.cacher.clean(`${this.name}.*`);
		},
		"cache.clean.follows"() {
			if (this.broker.cacher)
				this.broker.cacher.clean(`${this.name}.*`);
		}
	}	
};