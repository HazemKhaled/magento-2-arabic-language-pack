FROM node:12-slim

RUN mkdir /app
WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build && npm prune --production

CMD ["npm", "start"]
