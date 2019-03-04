# Knawat-MP

## Available scripts

```bash
# Start developing with REPL
npm run dev

# Start production
npm start

# Run unit tests
npm test

# Run continuous test mode
npm run ci

# Run ESLint
npm run lint

# Run ESLint with --fix
npm run lint-fix

# Formate the code with Prettier
npm run prettier
```

### Run without Docker (Development)

1.  `cp ./docker/development/docker-compose.example.env ./docker/development/docker-compose.env` and update your vars
2.  `npm run dev`

### Run in Docker (Development)

1.  `cd ./docker/development/`
2.  `cp docker-compose.example.env docker-compose.env` and update your vars
3.  Optional: Open docker-compose.yml and remove network if you don't have Traefik container running
4.  Start with docker-compose: `docker compose up -d`

### Run in Docker (Production)

1.  `cd ./docker/production/`
2.  `cp docker-compose.example.env docker-compose.env` and update your vars
3.  Start with docker-compose: `docker compose up -d`

    It starts all services in separated containers, a Redis server for caching and a [Traefik](https://traefik.io/) reverse proxy. All nodes communicate via NATs transporter.

4.  Open the https://docker-ip
5.  Scale up services

    `docker-compose scale api=3 auth=2 order=2 products=2`

## Documentation

https://knawat-mp.restlet.io/

#### MongoDB persistent store

This project using NeDB for local configurations and authentication, into path `./data`, while we using MongoDB to manage products with FOX, set the `MONGO_URI` environment variable to connect.

```
MONGO_URI=mongodb://localhost/suppliers
```

#### Multiple instances

You can run multiple instances of services. In this case you need to use a transporter i.e.: [NATS](https://nats.io). NATS is a lightweight & fast message broker. Download it and start with `gnatsd` command. After it started, set the `TRANSPORTER` env variable and start services.

```
TRANSPORTER=nats://localhost:4222
```

## Code Overview

### Dependencies

- [moleculer](https://github.com/moleculerjs/moleculer) - Microservices framework for NodeJS
- [moleculer-web](https://github.com/moleculerjs/moleculer-web) - Official API Gateway service for Moleculer
- [moleculer-db](https://github.com/moleculerjs/moleculer-db/tree/master/packages/moleculer-db#readme) - Database store service for Moleculer
- [moleculer-db-adapter-mongo](https://github.com/moleculerjs/moleculer-db/tree/master/packages/moleculer-db-adapter-mongo#readme) - Database store service for MongoDB _(optional)_
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) - To generate JWTs used by authentication
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js) - Hashing auth secret
- [lodash](https://github.com/lodash/lodash) - Utility library
- [ioredis](https://github.com/luin/ioredis) - [Redis](https://redis.io) server for caching _(optional)_
- [nats](https://github.com/nats-io/node-nats) - [NATS](https://nats.io) transport driver for Moleculer _(optional)_

### Application Structure

- `moleculer.config.js` - Moleculer ServiceBroker configuration file.
- `services/` - This folder contains the services.
- `data/` - This folder contains the NeDB database files.

## Test

```
$ npm test
```

In development with watching

```
$ npm run ci
```

## License

This code is copyrighted for Knawat LLC.
